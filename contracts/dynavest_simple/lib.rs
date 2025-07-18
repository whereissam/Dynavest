#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dynavest_simple {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    /// Strategy events
    #[ink(event)]
    pub struct StrategyCreated {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        creator: AccountId,
        name: String,
        risk_level: u8,
    }

    #[ink(event)]
    pub struct FundsDeposited {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        depositor: AccountId,
        amount: Balance,
    }

    /// Simple Strategy struct
    #[derive(Clone, Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub struct Strategy {
        pub id: u32,
        pub name: String,
        pub creator: AccountId,
        pub risk_level: u8,
        pub balance: Balance,
        pub is_active: bool,
    }

    /// Errors
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        StrategyNotFound,
        InsufficientFunds,
        Unauthorized,
        InvalidRiskLevel,
        StrategyInactive,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    /// DynaVest Simple Strategy Contract
    #[ink(storage)]
    pub struct DynavestSimple {
        /// Strategy counter
        strategy_counter: u32,
        /// Strategies mapping
        strategies: Mapping<u32, Strategy>,
        /// Investments mapping: (user, strategy_id) -> amount
        investments: Mapping<(AccountId, u32), Balance>,
        /// Contract owner
        owner: AccountId,
    }

    impl DynavestSimple {
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
                balance: value,
                is_active: true,
            };

            self.strategies.insert(strategy_id, &strategy);
            self.strategy_counter = strategy_id;

            // Record initial investment if any
            if value > 0 {
                self.investments.insert(&(caller, strategy_id), &value);
            }

            // Emit event
            self.env().emit_event(StrategyCreated {
                strategy_id,
                creator: caller,
                name,
                risk_level,
            });

            Ok(strategy_id)
        }

        /// Invest in a strategy
        #[ink(message, payable)]
        pub fn invest(&mut self, strategy_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let value = self.env().transferred_value();

            if value == 0 {
                return Err(Error::InsufficientFunds);
            }

            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if !strategy.is_active {
                return Err(Error::StrategyInactive);
            }

            // Update strategy balance
            strategy.balance += value;
            self.strategies.insert(strategy_id, &strategy);

            // Update user investment
            let current = self.investments.get(&(caller, strategy_id)).unwrap_or(0);
            self.investments.insert(&(caller, strategy_id), &(current + value));

            // Emit event
            self.env().emit_event(FundsDeposited {
                strategy_id,
                depositor: caller,
                amount: value,
            });

            Ok(())
        }

        /// Get strategy
        #[ink(message)]
        pub fn get_strategy(&self, strategy_id: u32) -> Option<Strategy> {
            self.strategies.get(&strategy_id)
        }

        /// Get user investment
        #[ink(message)]
        pub fn get_investment(&self, user: AccountId, strategy_id: u32) -> Balance {
            self.investments.get(&(user, strategy_id)).unwrap_or(0)
        }

        /// Get strategy count
        #[ink(message)]
        pub fn get_strategy_count(&self) -> u32 {
            self.strategy_counter
        }

        /// Get owner
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn default_works() {
            let contract = DynavestSimple::default();
            assert_eq!(contract.get_strategy_count(), 0);
        }

        #[ink::test]
        fn create_strategy_works() {
            let mut contract = DynavestSimple::default();
            
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            
            let result = contract.create_strategy("Test".to_string(), 5);
            assert!(result.is_ok());
            
            let strategy_id = result.unwrap();
            assert_eq!(strategy_id, 1);
            assert_eq!(contract.get_strategy_count(), 1);
            
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.name, "Test");
            assert_eq!(strategy.risk_level, 5);
            assert_eq!(strategy.balance, 1000);
        }

        #[ink::test]
        fn invest_works() {
            let mut contract = DynavestSimple::default();
            
            // Create strategy
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let strategy_id = contract.create_strategy("Test".to_string(), 5).unwrap();
            
            // Invest
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(500);
            let result = contract.invest(strategy_id);
            assert!(result.is_ok());
            
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.balance, 1500);
        }

        #[ink::test]
        fn invalid_risk_level_fails() {
            let mut contract = DynavestSimple::default();
            let result = contract.create_strategy("Test".to_string(), 11);
            assert_eq!(result, Err(Error::InvalidRiskLevel));
        }
    }

    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::ContractsBackend;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn e2e_create_and_invest_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Deploy contract
            let mut constructor = DynavestSimpleRef::default();
            let contract = client
                .instantiate("dynavest_simple", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");

            let call_builder = contract.call_builder::<DynavestSimple>();

            // Create strategy
            let create_call = call_builder.create_strategy("Test Strategy".to_string(), 7);
            let result = client
                .call(&ink_e2e::alice(), &create_call)
                .value(1000)
                .submit()
                .await
                .expect("create_strategy failed");

            assert!(result.return_value().is_ok());

            // Verify strategy count
            let count_call = call_builder.get_strategy_count();
            let count_result = client.call(&ink_e2e::alice(), &count_call).dry_run().await?;
            assert_eq!(count_result.return_value(), 1);

            // Invest in strategy
            let invest_call = call_builder.invest(1);
            let invest_result = client
                .call(&ink_e2e::bob(), &invest_call)
                .value(500)
                .submit()
                .await
                .expect("invest failed");

            assert!(invest_result.return_value().is_ok());

            // Check investment
            let investment_call = call_builder.get_investment(ink_e2e::account_id(ink_e2e::bob()), 1);
            let investment_result = client.call(&ink_e2e::bob(), &investment_call).dry_run().await?;
            assert_eq!(investment_result.return_value(), 500);

            Ok(())
        }
    }
}