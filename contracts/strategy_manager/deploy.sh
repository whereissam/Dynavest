#!/bin/bash

# Deployment script for Strategy Manager ink! contract

echo "🚀 Deploying Strategy Manager to Moonbeam..."

# Configuration
NETWORK_URL="wss://moonbeam-alpha.api.onfinality.io/public-ws"
DEPLOYMENT_ACCOUNT="//Alice"  # Change this to your deployment account

# Check if contract is built
if [ ! -f "target/ink/strategy_manager.contract" ]; then
    echo "📦 Contract not built. Building first..."
    ./build.sh
fi

# Deploy the contract
echo "📤 Uploading contract to network..."
cargo contract upload \
    --suri "$DEPLOYMENT_ACCOUNT" \
    --url "$NETWORK_URL" \
    --skip-confirm

if [ $? -eq 0 ]; then
    echo "✅ Contract uploaded successfully!"
    
    echo "🔧 Instantiating contract..."
    cargo contract instantiate \
        --suri "$DEPLOYMENT_ACCOUNT" \
        --url "$NETWORK_URL" \
        --constructor "new" \
        --skip-confirm
    
    if [ $? -eq 0 ]; then
        echo "✅ Contract deployed and instantiated successfully!"
        echo ""
        echo "🎉 Your Strategy Manager contract is now live on Moonbeam!"
        echo "📋 Save the contract address for your frontend integration."
    else
        echo "❌ Contract instantiation failed!"
        exit 1
    fi
else
    echo "❌ Contract upload failed!"
    exit 1
fi