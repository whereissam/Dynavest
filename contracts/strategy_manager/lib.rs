#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod strategy_manager {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use ink::prelude::string::String;

    /// Represents a DeFi strategy with its parameters and metadata
    #[derive(scale::Encode, scale::Decode, Clone, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Strategy {
        /// Unique identifier for the strategy
        pub id: u32,
        /// Human-readable name of the strategy
        pub name: String,
        /// Risk level from 1-10 (1 = lowest risk, 10 = highest risk)
        pub risk_level: u8,
        /// JSON-encoded parameters for the strategy
        pub parameters: String,
        /// Timestamp when the strategy was created
        pub created_at: u64,
        /// Whether the strategy is active
        pub is_active: bool,
    }

    /// Events emitted by the contract
    #[ink(event)]
    pub struct StrategyCreated {
        #[ink(topic)]
        pub account: AccountId,
        #[ink(topic)]
        pub strategy_id: u32,
        pub name: String,
        pub risk_level: u8,
    }

    #[ink(event)]
    pub struct StrategyUpdated {
        #[ink(topic)]
        pub account: AccountId,
        #[ink(topic)]
        pub strategy_id: u32,
        pub name: String,
        pub risk_level: u8,
    }

    #[ink(event)]
    pub struct StrategyDeleted {
        #[ink(topic)]
        pub account: AccountId,
        #[ink(topic)]
        pub strategy_id: u32,
    }

    /// Custom error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Strategy not found
        StrategyNotFound,
        /// Only the owner can perform this action
        OnlyOwner,
        /// Invalid risk level (must be 1-10)
        InvalidRiskLevel,
        /// Strategy name cannot be empty
        EmptyStrategyName,
        /// Strategy parameters cannot be empty
        EmptyParameters,
        /// Maximum number of strategies reached
        MaxStrategiesReached,
    }

    /// The Strategy Manager contract storage
    #[ink(storage)]
    pub struct StrategyManager {
        /// Mapping from account to their strategies
        strategies: Mapping<AccountId, Vec<Strategy>>,
        /// Global strategy counter for unique IDs
        next_strategy_id: u32,
        /// Maximum number of strategies per account
        max_strategies_per_account: u32,
    }

    /// Contract implementation
    impl StrategyManager {
        /// Constructor that initializes the contract
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                strategies: Mapping::new(),
                next_strategy_id: 1,
                max_strategies_per_account: 100, // Reasonable limit
            }
        }

        /// Save a new strategy for the caller
        #[ink(message)]
        pub fn save_strategy(
            &mut self,
            name: String,
            risk_level: u8,
            parameters: String,
        ) -> Result<u32, Error> {
            let caller = self.env().caller();
            
            // Validate inputs
            if name.is_empty() {
                return Err(Error::EmptyStrategyName);
            }
            
            if parameters.is_empty() {
                return Err(Error::EmptyParameters);
            }
            
            if risk_level < 1 || risk_level > 10 {
                return Err(Error::InvalidRiskLevel);
            }

            // Get current strategies for the caller
            let mut user_strategies = self.strategies.get(&caller).unwrap_or_default();
            
            // Check if user has reached the maximum number of strategies
            if user_strategies.len() >= self.max_strategies_per_account as usize {
                return Err(Error::MaxStrategiesReached);
            }

            // Create new strategy
            let strategy_id = self.next_strategy_id;
            let strategy = Strategy {
                id: strategy_id,
                name: name.clone(),
                risk_level,
                parameters,
                created_at: self.env().block_timestamp(),
                is_active: true,
            };

            // Add to user's strategies
            user_strategies.push(strategy);
            self.strategies.insert(&caller, &user_strategies);
            
            // Increment global counter
            self.next_strategy_id += 1;

            // Emit event
            self.env().emit_event(StrategyCreated {
                account: caller,
                strategy_id,
                name,
                risk_level,
            });

            Ok(strategy_id)
        }

        /// Get all strategies for a specific account
        #[ink(message)]
        pub fn get_strategies(&self, account: AccountId) -> Vec<Strategy> {
            self.strategies.get(&account).unwrap_or_default()
        }

        /// Get a specific strategy by ID for the caller
        #[ink(message)]
        pub fn get_strategy(&self, strategy_id: u32) -> Result<Strategy, Error> {
            let caller = self.env().caller();
            let user_strategies = self.strategies.get(&caller).unwrap_or_default();
            
            user_strategies
                .into_iter()
                .find(|s| s.id == strategy_id)
                .ok_or(Error::StrategyNotFound)
        }

        /// Update an existing strategy (only by owner)
        #[ink(message)]
        pub fn update_strategy(
            &mut self,
            strategy_id: u32,
            name: String,
            risk_level: u8,
            parameters: String,
        ) -> Result<(), Error> {
            let caller = self.env().caller();
            
            // Validate inputs
            if name.is_empty() {
                return Err(Error::EmptyStrategyName);
            }
            
            if parameters.is_empty() {
                return Err(Error::EmptyParameters);
            }
            
            if risk_level < 1 || risk_level > 10 {
                return Err(Error::InvalidRiskLevel);
            }

            // Get user's strategies
            let mut user_strategies = self.strategies.get(&caller).unwrap_or_default();
            
            // Find and update the strategy
            let strategy = user_strategies
                .iter_mut()
                .find(|s| s.id == strategy_id)
                .ok_or(Error::StrategyNotFound)?;

            strategy.name = name.clone();
            strategy.risk_level = risk_level;
            strategy.parameters = parameters;

            // Save updated strategies
            self.strategies.insert(&caller, &user_strategies);

            // Emit event
            self.env().emit_event(StrategyUpdated {
                account: caller,
                strategy_id,
                name,
                risk_level,
            });

            Ok(())
        }

        /// Delete a strategy (only by owner)
        #[ink(message)]
        pub fn delete_strategy(&mut self, strategy_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut user_strategies = self.strategies.get(&caller).unwrap_or_default();
            
            // Find the strategy index
            let index = user_strategies
                .iter()
                .position(|s| s.id == strategy_id)
                .ok_or(Error::StrategyNotFound)?;

            // Remove the strategy
            user_strategies.remove(index);
            self.strategies.insert(&caller, &user_strategies);

            // Emit event
            self.env().emit_event(StrategyDeleted {
                account: caller,
                strategy_id,
            });

            Ok(())
        }

        /// Get the total number of strategies for an account
        #[ink(message)]
        pub fn get_strategy_count(&self, account: AccountId) -> u32 {
            self.strategies.get(&account).unwrap_or_default().len() as u32
        }

        /// Get all active strategies for an account
        #[ink(message)]
        pub fn get_active_strategies(&self, account: AccountId) -> Vec<Strategy> {
            self.strategies
                .get(&account)
                .unwrap_or_default()
                .into_iter()
                .filter(|s| s.is_active)
                .collect()
        }

        /// Toggle strategy active status
        #[ink(message)]
        pub fn toggle_strategy_status(&mut self, strategy_id: u32) -> Result<(), Error> {
            let caller = self.env().caller();
            let mut user_strategies = self.strategies.get(&caller).unwrap_or_default();
            
            // Find and update the strategy
            let strategy = user_strategies
                .iter_mut()
                .find(|s| s.id == strategy_id)
                .ok_or(Error::StrategyNotFound)?;

            strategy.is_active = !strategy.is_active;

            // Save updated strategies
            self.strategies.insert(&caller, &user_strategies);

            Ok(())
        }

        /// Get the maximum number of strategies per account
        #[ink(message)]
        pub fn get_max_strategies_per_account(&self) -> u32 {
            self.max_strategies_per_account
        }

        /// Get the next strategy ID that will be assigned
        #[ink(message)]
        pub fn get_next_strategy_id(&self) -> u32 {
            self.next_strategy_id
        }
    }

    /// Unit tests
    #[cfg(test)]
    mod tests {
        use super::*;

        #[ink::test]
        fn new_works() {
            let contract = StrategyManager::new();
            assert_eq!(contract.get_next_strategy_id(), 1);
            assert_eq!(contract.get_max_strategies_per_account(), 100);
        }

        #[ink::test]
        fn save_strategy_works() {
            let mut contract = StrategyManager::new();
            let result = contract.save_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            );
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
        }

        #[ink::test]
        fn get_strategies_works() {
            let mut contract = StrategyManager::new();
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            
            // Save a strategy
            contract.save_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            ).unwrap();
            
            // Get strategies
            let strategies = contract.get_strategies(accounts.alice);
            assert_eq!(strategies.len(), 1);
            assert_eq!(strategies[0].name, "Test Strategy");
            assert_eq!(strategies[0].risk_level, 5);
        }

        #[ink::test]
        fn invalid_risk_level_fails() {
            let mut contract = StrategyManager::new();
            let result = contract.save_strategy(
                "Test Strategy".to_string(),
                11, // Invalid risk level
                "{}".to_string(),
            );
            assert_eq!(result, Err(Error::InvalidRiskLevel));
        }

        #[ink::test]
        fn empty_name_fails() {
            let mut contract = StrategyManager::new();
            let result = contract.save_strategy(
                "".to_string(), // Empty name
                5,
                "{}".to_string(),
            );
            assert_eq!(result, Err(Error::EmptyStrategyName));
        }

        #[ink::test]
        fn update_strategy_works() {
            let mut contract = StrategyManager::new();
            
            // Save a strategy
            let strategy_id = contract.save_strategy(
                "Original Strategy".to_string(),
                5,
                "{}".to_string(),
            ).unwrap();
            
            // Update the strategy
            let result = contract.update_strategy(
                strategy_id,
                "Updated Strategy".to_string(),
                8,
                "{\"updated\": true}".to_string(),
            );
            assert!(result.is_ok());
            
            // Verify the update
            let strategy = contract.get_strategy(strategy_id).unwrap();
            assert_eq!(strategy.name, "Updated Strategy");
            assert_eq!(strategy.risk_level, 8);
        }

        #[ink::test]
        fn delete_strategy_works() {
            let mut contract = StrategyManager::new();
            
            // Save a strategy
            let strategy_id = contract.save_strategy(
                "Test Strategy".to_string(),
                5,
                "{}".to_string(),
            ).unwrap();
            
            // Delete the strategy
            let result = contract.delete_strategy(strategy_id);
            assert!(result.is_ok());
            
            // Verify deletion
            let accounts = ink::env::test::default_accounts::<ink::env::DefaultEnvironment>();
            let strategies = contract.get_strategies(accounts.alice);
            assert_eq!(strategies.len(), 0);
        }
    }
}