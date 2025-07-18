#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dynavest_basic {
    use ink::prelude::string::String;
    use ink::storage::Mapping;
    use ink::primitives::H160;
    
    /// Strategy data structure
    #[derive(Debug, Clone, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Strategy {
        pub id: u32,
        pub name: String,
        pub creator: H160,
        pub risk_level: u8,
        pub balance: u128,
        pub is_active: bool,
    }

    /// Contract events
    #[ink(event)]
    pub struct StrategyCreated {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        creator: H160,
        name: String,
        risk_level: u8,
    }

    #[ink(event)]
    pub struct FundsInvested {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        investor: H160,
        amount: u128,
    }

    /// Error types
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        StrategyNotFound,
        InvalidRiskLevel,
        InsufficientFunds,
        Unauthorized,
        StrategyInactive,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    /// DynaVest Basic Strategy Contract
    #[ink(storage)]
    pub struct DynavestBasic {
        /// Strategy counter
        strategy_counter: u32,
        /// Strategies mapping
        strategies: Mapping<u32, Strategy>,
        /// Investments mapping: (investor, strategy_id) -> amount
        investments: Mapping<(H160, u32), u128>,
        /// Contract owner
        owner: H160,
    }

    impl DynavestBasic {
        /// Constructor
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                strategy_counter: 0,
                strategies: Mapping::default(),
                investments: Mapping::default(),
                owner: Self::env().caller(),
            }
        }

        /// Default constructor
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new()
        }

        /// Create a new strategy
        #[ink(message, payable)]
        pub fn create_strategy(&mut self, name: String, risk_level: u8) -> Result<u32> {
            if risk_level == 0 || risk_level > 10 {
                return Err(Error::InvalidRiskLevel);
            }

            let caller = self.env().caller();
            let value = self.env().transferred_value();
            let strategy_id = self.strategy_counter + 1;

            let strategy = Strategy {
                id: strategy_id,
                name: name.clone(),
                creator: caller,
                risk_level,
                balance: value.as_u128(),
                is_active: true,
            };

            self.strategies.insert(strategy_id, &strategy);
            self.strategy_counter = strategy_id;

            // Record initial investment if any
            if !value.is_zero() {
                self.investments.insert(&(caller, strategy_id), &value.as_u128());
            }

            self.env().emit_event(StrategyCreated {
                strategy_id,
                creator: caller,
                name,
                risk_level,
            });

            Ok(strategy_id)
        }

        /// Get strategy details
        #[ink(message)]
        pub fn get_strategy(&self, strategy_id: u32) -> Option<Strategy> {
            self.strategies.get(&strategy_id)
        }

        /// Get strategy count
        #[ink(message)]
        pub fn get_strategy_count(&self) -> u32 {
            self.strategy_counter
        }

        /// Invest in a strategy
        #[ink(message, payable)]
        pub fn invest_in_strategy(&mut self, strategy_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let value = self.env().transferred_value();

            if value.is_zero() {
                return Err(Error::InsufficientFunds);
            }

            // Check if strategy exists and is active
            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if !strategy.is_active {
                return Err(Error::StrategyInactive);
            }

            // Update strategy balance
            strategy.balance += value.as_u128();
            self.strategies.insert(strategy_id, &strategy);

            // Update investor's investment
            let current_investment = self.investments.get(&(caller, strategy_id)).unwrap_or(0);
            self.investments.insert(&(caller, strategy_id), &(current_investment + value.as_u128()));

            self.env().emit_event(FundsInvested {
                strategy_id,
                investor: caller,
                amount: value.as_u128(),
            });

            Ok(())
        }

        /// Get investment amount for a specific investor and strategy
        #[ink(message)]
        pub fn get_investment(&self, investor: H160, strategy_id: u32) -> u128 {
            self.investments.get(&(investor, strategy_id)).unwrap_or(0)
        }

        /// Get contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> H160 {
            self.owner
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn default_works() {
            let contract = DynavestBasic::default();
            assert_eq!(contract.get_strategy_count(), 0);
        }

        #[ink::test]
        fn create_strategy_works() {
            let mut contract = DynavestBasic::default();
            
            ink::env::test::set_value_transferred(1000_u128.into());
            
            let result = contract.create_strategy("Test Strategy".to_string(), 5);
            assert!(result.is_ok());
            
            let strategy_id = result.unwrap();
            assert_eq!(strategy_id, 1);
            assert_eq!(contract.get_strategy_count(), 1);
            
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.name, "Test Strategy");
            assert_eq!(strategy.risk_level, 5);
            assert_eq!(strategy.balance, 1000);
            
            // Check initial investment was recorded
            let caller = ink::env::test::default_accounts().alice;
            let investment = contract.get_investment(caller, strategy_id);
            assert_eq!(investment, 1000);
        }

        #[ink::test]
        fn invalid_risk_level_fails() {
            let mut contract = DynavestBasic::default();
            let result = contract.create_strategy("Test".to_string(), 11);
            assert_eq!(result, Err(Error::InvalidRiskLevel));
        }

        #[ink::test]
        fn invest_in_strategy_works() {
            let mut contract = DynavestBasic::default();
            
            // Create a strategy first
            ink::env::test::set_value_transferred(1000_u128.into());
            let strategy_id = contract.create_strategy("Test Strategy".to_string(), 5).unwrap();
            
            // Get the caller (alice is the default caller)
            let caller = ink::env::test::default_accounts().alice;
            
            // Check initial investment after creating strategy
            let initial_investment = contract.get_investment(caller, strategy_id);
            assert_eq!(initial_investment, 1000);
            
            // Invest in the strategy
            ink::env::test::set_value_transferred(500_u128.into());
            let result = contract.invest_in_strategy(strategy_id);
            assert!(result.is_ok());
            
            // Check strategy balance updated
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.balance, 1500); // 1000 + 500
            
            // Check investment recorded (alice already invested 1000 when creating, + 500 now)
            let investment = contract.get_investment(caller, strategy_id);
            assert_eq!(investment, 1500); // Initial 1000 + additional 500
        }

        #[ink::test]
        fn invest_in_nonexistent_strategy_fails() {
            let mut contract = DynavestBasic::default();
            
            ink::env::test::set_value_transferred(500_u128.into());
            let result = contract.invest_in_strategy(999);
            assert_eq!(result, Err(Error::StrategyNotFound));
        }

        #[ink::test]
        fn invest_with_zero_value_fails() {
            let mut contract = DynavestBasic::default();
            
            // Create a strategy first
            ink::env::test::set_value_transferred(1000_u128.into());
            let strategy_id = contract.create_strategy("Test Strategy".to_string(), 5).unwrap();
            
            // Try to invest with zero value
            ink::env::test::set_value_transferred(0_u128.into());
            let result = contract.invest_in_strategy(strategy_id);
            assert_eq!(result, Err(Error::InsufficientFunds));
        }

        #[ink::test]
        fn debug_investment_mapping() {
            let mut contract = DynavestBasic::default();
            let caller = ink::env::test::default_accounts().alice;
            
            // Test direct mapping insert
            contract.investments.insert(&(caller, 1), &500);
            let investment = contract.get_investment(caller, 1);
            assert_eq!(investment, 500);
        }

        #[ink::test]
        fn debug_create_strategy_no_value() {
            let mut contract = DynavestBasic::default();
            let caller = ink::env::test::default_accounts().alice;
            
            // Create strategy without value
            ink::env::test::set_value_transferred(0_u128.into());
            let strategy_id = contract.create_strategy("Test".to_string(), 5).unwrap();
            
            // Should have no investment
            let investment = contract.get_investment(caller, strategy_id);
            assert_eq!(investment, 0);
        }

        #[ink::test]
        fn debug_create_strategy_with_value() {
            let mut contract = DynavestBasic::default();
            let caller = ink::env::test::default_accounts().alice;
            
            // Create strategy with value - set right before calling
            ink::env::test::set_value_transferred(1000_u128.into());
            let strategy_id = contract.create_strategy("Test".to_string(), 5).unwrap();
            
            // Check the strategy balance was set correctly
            let strategy = contract.get_strategy(strategy_id).unwrap();
            // If this passes, the env().transferred_value() is working
            assert_eq!(strategy.balance, 1000);
            
            // Should have investment
            let investment = contract.get_investment(caller, strategy_id);
            assert_eq!(investment, 1000);
        }
    }


    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::ContractsBackend;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let mut constructor = DynavestBasicRef::default();
            let contract = client
                .instantiate("dynavest_basic", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let call_builder = contract.call_builder::<DynavestBasic>();

            let get_count = call_builder.get_strategy_count();
            let count_result = client.call(&ink_e2e::alice(), &get_count).dry_run().await?;
            assert_eq!(count_result.return_value(), 0);

            Ok(())
        }

        #[ink_e2e::test]
        async fn create_strategy_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let mut constructor = DynavestBasicRef::default();
            let contract = client
                .instantiate("dynavest_basic", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let call_builder = contract.call_builder::<DynavestBasic>();

            let create_call = call_builder.create_strategy("Test Strategy".to_string(), 7);
            let result = client
                .call(&ink_e2e::alice(), &create_call)
                .value(1000)
                .submit()
                .await
                .expect("create_strategy failed");

            assert!(result.return_value().is_ok());

            let count_call = call_builder.get_strategy_count();
            let count_result = client.call(&ink_e2e::alice(), &count_call).dry_run().await?;
            assert_eq!(count_result.return_value(), 1);

            Ok(())
        }

        #[ink_e2e::test]
        async fn invest_in_strategy_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let mut constructor = DynavestBasicRef::default();
            let contract = client
                .instantiate("dynavest_basic", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let call_builder = contract.call_builder::<DynavestBasic>();

            // Create strategy
            let create_call = call_builder.create_strategy("Test Strategy".to_string(), 7);
            let _result = client
                .call(&ink_e2e::alice(), &create_call)
                .value(1000)
                .submit()
                .await
                .expect("create_strategy failed");

            // Invest in strategy
            let invest_call = call_builder.invest_in_strategy(1);
            let invest_result = client
                .call(&ink_e2e::bob(), &invest_call)
                .value(500)
                .submit()
                .await
                .expect("invest_in_strategy failed");

            assert!(invest_result.return_value().is_ok());

            // Check investment
            let investment_call = call_builder.get_investment(ink_e2e::account_id(ink_e2e::bob()), 1);
            let investment_result = client.call(&ink_e2e::bob(), &investment_call).dry_run().await?;
            assert_eq!(investment_result.return_value(), 500);

            Ok(())
        }
    }
}
