# Strategy Manager ink! Smart Contract

A Polkadot/Substrate smart contract for managing DeFi strategies on the blockchain, built with ink! for the DynaVest platform.

## 🎯 Overview

The Strategy Manager contract allows users to:
- **Save DeFi strategies** with parameters and risk levels
- **Retrieve saved strategies** for their account
- **Update existing strategies** with new parameters
- **Delete strategies** they no longer need
- **Track strategy metadata** including creation time and active status

## 🏗️ Contract Structure

### Data Types

```rust
pub struct Strategy {
    pub id: u32,                // Unique strategy identifier
    pub name: String,           // Human-readable strategy name
    pub risk_level: u8,         // Risk level 1-10
    pub parameters: String,     // JSON-encoded strategy parameters
    pub created_at: u64,        // Creation timestamp
    pub is_active: bool,        // Whether strategy is active
}
```

### Key Functions

| Function | Description | Access |
|----------|-------------|--------|
| `save_strategy()` | Save a new strategy | Public |
| `get_strategies()` | Get all strategies for an account | Public |
| `get_strategy()` | Get a specific strategy by ID | Owner only |
| `update_strategy()` | Update an existing strategy | Owner only |
| `delete_strategy()` | Delete a strategy | Owner only |
| `get_strategy_count()` | Get total number of strategies | Public |
| `get_active_strategies()` | Get only active strategies | Public |
| `toggle_strategy_status()` | Toggle active/inactive status | Owner only |

### Events

- `StrategyCreated` - Emitted when a new strategy is saved
- `StrategyUpdated` - Emitted when a strategy is updated
- `StrategyDeleted` - Emitted when a strategy is deleted

### Error Handling

The contract includes comprehensive error handling:
- `StrategyNotFound` - Strategy doesn't exist
- `OnlyOwner` - Only strategy owner can perform action
- `InvalidRiskLevel` - Risk level must be 1-10
- `EmptyStrategyName` - Strategy name cannot be empty
- `EmptyParameters` - Parameters cannot be empty
- `MaxStrategiesReached` - User has reached maximum strategies (100)

## 🚀 Building and Deployment

### Prerequisites

1. **Install Rust** (if not already installed):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. **Install ink! CLI**:
```bash
cargo install cargo-contract --force
```

3. **Add WebAssembly target**:
```bash
rustup target add wasm32-unknown-unknown
```

### Building

```bash
# Build the contract
./build.sh

# Or manually:
cargo contract build --release
```

### Testing

```bash
# Run unit tests
cargo test

# Run with detailed output
cargo test -- --nocapture
```

### Deployment

1. **Deploy to Moonbeam testnet**:
```bash
# Using Polkadot.js Apps or contracts-ui
# Upload the .contract file from target/ink/
```

2. **Using cargo-contract**:
```bash
cargo contract upload --suri "//Alice" --url ws://127.0.0.1:9944
cargo contract instantiate --suri "//Alice" --url ws://127.0.0.1:9944 --constructor new
```

## 🔗 Integration with DynaVest

The contract integrates with the DynaVest platform through:

1. **Frontend calls** via Polkadot.js API
2. **Shuttle.dev backend** as middleware
3. **REST API endpoints** for strategy management

### Frontend Integration Example

```javascript
// Save a strategy
const result = await contract.tx.saveStrategy(
  "My Strategy",
  7,
  JSON.stringify({ protocol: "Aave", asset: "USDC" })
);

// Get strategies
const strategies = await contract.query.getStrategies(userAccount);
```

## 📊 Contract Specifications

- **Max strategies per account**: 100
- **Risk level range**: 1-10 (1 = lowest, 10 = highest)
- **Strategy name**: Max 256 characters
- **Parameters**: JSON string, max 4KB
- **Gas optimization**: Optimized for minimal gas usage

## 🧪 Testing

The contract includes comprehensive unit tests covering:
- Strategy creation and retrieval
- Input validation
- Error handling
- Edge cases
- Access control

Run tests with:
```bash
cargo test
```

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests: `cargo test`
4. Submit a pull request

## 📞 Support

For support and questions:
- GitHub Issues: [DynaVest Repository](https://github.com/LI-YONG-QI/agentic-hack)
- Discord: [DynaVest Community](https://discord.gg/dynavest)
- Documentation: [DynaVest Docs](https://docs.dynavest.app)

---

Built with ❤️ for the Polkadot ecosystem by the DynaVest team.