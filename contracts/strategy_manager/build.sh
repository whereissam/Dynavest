#!/bin/bash

# Build script for the Strategy Manager ink! contract

echo "🔨 Building Strategy Manager ink! contract..."

# Check if cargo-contract is installed
if ! command -v cargo-contract &> /dev/null; then
    echo "❌ cargo-contract is not installed. Please install it with:"
    echo "cargo install cargo-contract --force"
    exit 1
fi

# Build the contract
echo "📦 Compiling contract..."
cargo contract build --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Contract built successfully!"
    echo "📁 Artifacts available in: target/ink/"
    echo ""
    echo "📝 Contract files:"
    ls -la target/ink/
    echo ""
    echo "🚀 Ready for deployment to Moonbeam!"
else
    echo "❌ Build failed!"
    exit 1
fi