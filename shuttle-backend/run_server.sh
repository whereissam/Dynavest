#!/bin/bash

echo "🚀 Starting DynaVest Shuttle Backend..."

# Check if Secrets.toml exists
if [ ! -f "Secrets.toml" ]; then
    echo "❌ Secrets.toml not found!"
    echo "Please create Secrets.toml with your API keys first."
    exit 1
fi

# Export environment variables from Secrets.toml
echo "🔑 Loading API keys from Secrets.toml..."
export OPENAI_API_KEY=$(grep "OPENAI_API_KEY" Secrets.toml | cut -d '"' -f 2)
export QDRANT_URL=$(grep "QDRANT_URL" Secrets.toml | cut -d '"' -f 2)
export QDRANT_API_KEY=$(grep "QDRANT_API_KEY" Secrets.toml | cut -d '"' -f 2)

echo "✅ API keys loaded"
echo "🌐 Qdrant URL: $QDRANT_URL"
echo "🤖 OpenAI API Key: ${OPENAI_API_KEY:0:10}..."

# Start the server
echo "🏃 Starting shuttle server..."
shuttle run