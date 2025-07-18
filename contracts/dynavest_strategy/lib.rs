#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod dynavest_strategy {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;
    use ink::storage::traits::ManualKey;

    /// DynaVest Strategy Event Types
    #[ink(event)]
    pub struct StrategyCreated {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        creator: AccountId,
        name: String,
        risk_level: u8,
        initial_balance: Balance,
    }

    #[ink(event)]
    pub struct StrategyUpdated {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        updater: AccountId,
        parameters: String,
    }

    #[ink(event)]
    pub struct FundsDeposited {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        depositor: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FundsWithdrawn {
        #[ink(topic)]
        strategy_id: u32,
        #[ink(topic)]
        withdrawer: AccountId,
        amount: Balance,
    }

    /// DynaVest Strategy Data Structure
    #[derive(ink::storage::traits::Packed)]
    #[ink(storage)]
    pub struct Strategy {
        pub id: u32,
        pub name: String,
        pub creator: AccountId,
        pub risk_level: u8, // 1-10 scale
        pub parameters: String, // JSON parameters
        pub balance: Balance,
        pub total_invested: Balance,
        pub is_active: bool,
        pub created_at: Timestamp,
        pub updated_at: Timestamp,
    }

    /// Error types for the DynaVest Strategy contract
    #[derive(Debug, PartialEq, Eq)]
    #[ink::scale_derive(Encode, Decode, TypeInfo)]
    pub enum Error {
        /// Strategy not found
        StrategyNotFound,
        /// Insufficient funds
        InsufficientFunds,
        /// Unauthorized access
        Unauthorized,
        /// Invalid risk level (must be 1-10)
        InvalidRiskLevel,
        /// Strategy is inactive
        StrategyInactive,
        /// Transfer failed
        TransferFailed,
        /// Invalid parameters
        InvalidParameters,
        /// Strategy name too long
        NameTooLong,
        /// Maximum strategies reached
        MaxStrategiesReached,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    /// The DynaVest Strategy Management Contract
    #[ink(storage)]
    pub struct DynavestStrategy {
        /// Counter for strategy IDs
        strategy_counter: u32,
        /// Mapping from strategy ID to Strategy data
        strategies: Mapping<u32, Strategy, ManualKey<0x01>>,
        /// Mapping from (investor, strategy_id) to investment amount
        investments: Mapping<(AccountId, u32), Balance, ManualKey<0x02>>,
        /// Mapping from investor to list of strategy IDs they've invested in
        investor_strategies: Mapping<AccountId, Vec<u32>, ManualKey<0x03>>,
        /// Mapping from strategy creator to list of strategy IDs they've created
        creator_strategies: Mapping<AccountId, Vec<u32>, ManualKey<0x04>>,
        /// Contract owner/admin
        owner: AccountId,
        /// Maximum number of strategies
        max_strategies: u32,
        /// Platform fee percentage (in basis points, 100 = 1%)
        platform_fee: u16,
    }

    impl DynavestStrategy {
        /// Constructor - Initialize the DynaVest Strategy contract
        #[ink(constructor)]
        pub fn new(max_strategies: u32, platform_fee: u16) -> Self {
            let caller = Self::env().caller();
            Self {
                strategy_counter: 0,
                strategies: Mapping::default(),
                investments: Mapping::default(),
                investor_strategies: Mapping::default(),
                creator_strategies: Mapping::default(),
                owner: caller,
                max_strategies,
                platform_fee,
            }
        }

        /// Default constructor
        #[ink(constructor)]
        pub fn default() -> Self {
            Self::new(1000, 100) // 1000 max strategies, 1% platform fee
        }

        /// Create a new DeFi strategy
        #[ink(message, payable)]
        pub fn create_strategy(
            &mut self,
            name: String,
            risk_level: u8,
            parameters: String,
        ) -> Result<u32> {
            let caller = self.env().caller();
            let value = self.env().transferred_value();
            let timestamp = self.env().block_timestamp();

            // Validate inputs
            if name.len() > 100 {
                return Err(Error::NameTooLong);
            }
            if risk_level == 0 || risk_level > 10 {
                return Err(Error::InvalidRiskLevel);
            }
            if parameters.len() > 1000 {
                return Err(Error::InvalidParameters);
            }
            if self.strategy_counter >= self.max_strategies {
                return Err(Error::MaxStrategiesReached);
            }

            // Create new strategy
            let strategy_id = self.strategy_counter + 1;
            let strategy = Strategy {
                id: strategy_id,
                name: name.clone(),
                creator: caller,
                risk_level,
                parameters: parameters.clone(),
                balance: value,
                total_invested: value,
                is_active: true,
                created_at: timestamp,
                updated_at: timestamp,
            };

            // Store strategy
            self.strategies.insert(strategy_id, &strategy);
            self.strategy_counter = strategy_id;

            // Update creator's strategy list
            let mut creator_list = self.creator_strategies.get(&caller).unwrap_or_default();
            creator_list.push(strategy_id);
            self.creator_strategies.insert(&caller, &creator_list);

            // If value was sent, record as initial investment
            if value > 0 {
                self.investments.insert(&(caller, strategy_id), &value);
                let mut investor_list = self.investor_strategies.get(&caller).unwrap_or_default();
                if !investor_list.contains(&strategy_id) {
                    investor_list.push(strategy_id);
                    self.investor_strategies.insert(&caller, &investor_list);
                }
            }

            // Emit event
            self.env().emit_event(StrategyCreated {
                strategy_id,
                creator: caller,
                name,
                risk_level,
                initial_balance: value,
            });

            Ok(strategy_id)
        }

        /// Invest in an existing strategy
        #[ink(message, payable)]
        pub fn invest_in_strategy(&mut self, strategy_id: u32) -> Result<()> {
            let caller = self.env().caller();
            let value = self.env().transferred_value();

            if value == 0 {
                return Err(Error::InsufficientFunds);
            }

            // Get and validate strategy
            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if !strategy.is_active {
                return Err(Error::StrategyInactive);
            }

            // Update strategy balance
            strategy.balance += value;
            strategy.total_invested += value;
            strategy.updated_at = self.env().block_timestamp();
            self.strategies.insert(strategy_id, &strategy);

            // Update investor's investment
            let current_investment = self.investments.get(&(caller, strategy_id)).unwrap_or(0);
            self.investments.insert(&(caller, strategy_id), &(current_investment + value));

            // Update investor's strategy list
            let mut investor_list = self.investor_strategies.get(&caller).unwrap_or_default();
            if !investor_list.contains(&strategy_id) {
                investor_list.push(strategy_id);
                self.investor_strategies.insert(&caller, &investor_list);
            }

            // Emit event
            self.env().emit_event(FundsDeposited {
                strategy_id,
                depositor: caller,
                amount: value,
            });

            Ok(())
        }

        /// Withdraw from a strategy
        #[ink(message)]
        pub fn withdraw_from_strategy(&mut self, strategy_id: u32, amount: Balance) -> Result<()> {
            let caller = self.env().caller();

            // Get and validate strategy
            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if !strategy.is_active {
                return Err(Error::StrategyInactive);
            }

            // Check investor's balance
            let investment = self.investments.get(&(caller, strategy_id)).unwrap_or(0);
            if investment < amount {
                return Err(Error::InsufficientFunds);
            }

            // Check strategy has enough balance
            if strategy.balance < amount {
                return Err(Error::InsufficientFunds);
            }

            // Update balances
            strategy.balance -= amount;
            strategy.updated_at = self.env().block_timestamp();
            self.strategies.insert(strategy_id, &strategy);

            let new_investment = investment - amount;
            if new_investment == 0 {
                self.investments.remove(&(caller, strategy_id));
                // Remove from investor's strategy list
                let mut investor_list = self.investor_strategies.get(&caller).unwrap_or_default();
                if let Some(pos) = investor_list.iter().position(|&x| x == strategy_id) {
                    investor_list.remove(pos);
                }
                self.investor_strategies.insert(&caller, &investor_list);
            } else {
                self.investments.insert(&(caller, strategy_id), &new_investment);
            }

            // Transfer funds
            if self.env().transfer(caller, amount).is_err() {
                return Err(Error::TransferFailed);
            }

            // Emit event
            self.env().emit_event(FundsWithdrawn {
                strategy_id,
                withdrawer: caller,
                amount,
            });

            Ok(())
        }

        /// Update strategy parameters (only creator can do this)
        #[ink(message)]
        pub fn update_strategy(&mut self, strategy_id: u32, parameters: String) -> Result<()> {
            let caller = self.env().caller();

            // Get and validate strategy
            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if strategy.creator != caller {
                return Err(Error::Unauthorized);
            }
            if parameters.len() > 1000 {
                return Err(Error::InvalidParameters);
            }

            // Update strategy
            strategy.parameters = parameters.clone();
            strategy.updated_at = self.env().block_timestamp();
            self.strategies.insert(strategy_id, &strategy);

            // Emit event
            self.env().emit_event(StrategyUpdated {
                strategy_id,
                updater: caller,
                parameters,
            });

            Ok(())
        }

        /// Deactivate a strategy (only creator or owner)
        #[ink(message)]
        pub fn deactivate_strategy(&mut self, strategy_id: u32) -> Result<()> {
            let caller = self.env().caller();

            // Get and validate strategy
            let mut strategy = self.strategies.get(&strategy_id).ok_or(Error::StrategyNotFound)?;
            if strategy.creator != caller && caller != self.owner {
                return Err(Error::Unauthorized);
            }

            // Deactivate strategy
            strategy.is_active = false;
            strategy.updated_at = self.env().block_timestamp();
            self.strategies.insert(strategy_id, &strategy);

            Ok(())
        }

        /// Get strategy details
        #[ink(message)]
        pub fn get_strategy(&self, strategy_id: u32) -> Option<Strategy> {
            self.strategies.get(&strategy_id)
        }

        /// Get all strategies created by a user
        #[ink(message)]
        pub fn get_creator_strategies(&self, creator: AccountId) -> Vec<u32> {
            self.creator_strategies.get(&creator).unwrap_or_default()
        }

        /// Get all strategies an investor has invested in
        #[ink(message)]
        pub fn get_investor_strategies(&self, investor: AccountId) -> Vec<u32> {
            self.investor_strategies.get(&investor).unwrap_or_default()
        }

        /// Get investment amount for a specific investor and strategy
        #[ink(message)]
        pub fn get_investment(&self, investor: AccountId, strategy_id: u32) -> Balance {
            self.investments.get(&(investor, strategy_id)).unwrap_or(0)
        }

        /// Get total number of strategies
        #[ink(message)]
        pub fn get_strategy_count(&self) -> u32 {
            self.strategy_counter
        }

        /// Get contract owner
        #[ink(message)]
        pub fn get_owner(&self) -> AccountId {
            self.owner
        }

        /// Get platform fee
        #[ink(message)]
        pub fn get_platform_fee(&self) -> u16 {
            self.platform_fee
        }

        /// Update platform fee (only owner)
        #[ink(message)]
        pub fn set_platform_fee(&mut self, new_fee: u16) -> Result<()> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(Error::Unauthorized);
            }
            self.platform_fee = new_fee;
            Ok(())
        }

        /// Transfer ownership (only current owner)
        #[ink(message)]
        pub fn transfer_ownership(&mut self, new_owner: AccountId) -> Result<()> {
            let caller = self.env().caller();
            if caller != self.owner {
                return Err(Error::Unauthorized);
            }
            self.owner = new_owner;
            Ok(())
        }
    }

    /// Unit tests
    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn default_works() {
            let contract = DynavestStrategy::default();
            assert_eq!(contract.get_strategy_count(), 0);
            assert_eq!(contract.get_platform_fee(), 100);
        }

        #[ink::test]
        fn create_strategy_works() {
            let mut contract = DynavestStrategy::default();
            
            // Set initial balance for the test
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            
            let result = contract.create_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            );
            
            assert!(result.is_ok());
            let strategy_id = result.unwrap();
            assert_eq!(strategy_id, 1);
            assert_eq!(contract.get_strategy_count(), 1);
            
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.name, "Test Strategy");
            assert_eq!(strategy.risk_level, 5);
            assert_eq!(strategy.balance, 1000);
        }

        #[ink::test]
        fn invalid_risk_level_fails() {
            let mut contract = DynavestStrategy::default();
            
            let result = contract.create_strategy(
                "Test Strategy".to_string(),
                11, // Invalid risk level
                "{}".to_string(),
            );
            
            assert_eq!(result, Err(Error::InvalidRiskLevel));
        }

        #[ink::test]
        fn invest_in_strategy_works() {
            let mut contract = DynavestStrategy::default();
            
            // Create a strategy first
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(1000);
            let strategy_id = contract.create_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            ).unwrap();
            
            // Invest in the strategy
            ink::env::test::set_value_transferred::<ink::env::DefaultEnvironment>(500);
            let result = contract.invest_in_strategy(strategy_id);
            
            assert!(result.is_ok());
            
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.balance, 1500); // 1000 + 500
            assert_eq!(strategy.total_invested, 1500);
        }

        #[ink::test]
        fn unauthorized_update_fails() {
            let mut contract = DynavestStrategy::default();
            
            // Create strategy with Alice
            let alice = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().alice;
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(alice);
            
            let strategy_id = contract.create_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            ).unwrap();
            
            // Try to update with Bob
            let bob = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>().bob;
            ink::env::test::set_caller::<ink::env::DefaultEnvironment>(bob);
            
            let result = contract.update_strategy(strategy_id, "new params".to_string());
            assert_eq!(result, Err(Error::Unauthorized));
        }
    }

    /// End-to-end tests
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::ContractsBackend;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        #[ink_e2e::test]
        async fn e2e_create_strategy_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Deploy contract
            let mut constructor = DynavestStrategyRef::default();
            let contract = client
                .instantiate("dynavest_strategy", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");

            // Create strategy
            let call_builder = contract.call_builder::<DynavestStrategy>();
            let create_call = call_builder.create_strategy(
                "E2E Test Strategy".to_string(),
                7,
                "{\"protocol\": \"uniswap\"}".to_string(),
            );

            let result = client
                .call(&ink_e2e::alice(), &create_call)
                .value(1000)
                .submit()
                .await
                .expect("create_strategy failed");

            assert!(result.return_value().is_ok());

            // Verify strategy was created
            let get_count = call_builder.get_strategy_count();
            let count_result = client.call(&ink_e2e::alice(), &get_count).dry_run().await?;
            assert_eq!(count_result.return_value(), 1);

            Ok(())
        }

        #[ink_e2e::test]
        async fn e2e_invest_and_withdraw_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            // Deploy contract
            let mut constructor = DynavestStrategyRef::default();
            let contract = client
                .instantiate("dynavest_strategy", &ink_e2e::alice(), &mut constructor)
                .submit()
                .await
                .expect("instantiate failed");

            let call_builder = contract.call_builder::<DynavestStrategy>();

            // Create strategy
            let create_call = call_builder.create_strategy(
                "Investment Test".to_string(),
                5,
                "{}".to_string(),
            );

            let _result = client
                .call(&ink_e2e::alice(), &create_call)
                .value(1000)
                .submit()
                .await
                .expect("create_strategy failed");

            // Invest in strategy
            let invest_call = call_builder.invest_in_strategy(1);
            let _invest_result = client
                .call(&ink_e2e::bob(), &invest_call)
                .value(500)
                .submit()
                .await
                .expect("invest_in_strategy failed");

            // Check investment
            let get_investment = call_builder.get_investment(ink_e2e::account_id(ink_e2e::bob()), 1);
            let investment_result = client.call(&ink_e2e::bob(), &get_investment).dry_run().await?;
            assert_eq!(investment_result.return_value(), 500);

            // Withdraw from strategy
            let withdraw_call = call_builder.withdraw_from_strategy(1, 200);
            let _withdraw_result = client
                .call(&ink_e2e::bob(), &withdraw_call)
                .submit()
                .await
                .expect("withdraw_from_strategy failed");

            // Check remaining investment
            let remaining_investment = client.call(&ink_e2e::bob(), &get_investment).dry_run().await?;
            assert_eq!(remaining_investment.return_value(), 300);

            Ok(())
        }
    }
}