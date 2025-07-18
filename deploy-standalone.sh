#!/bin/bash

# DynaVest Standalone Deployment Script
# Alternative to Shuttle.dev deployment

set -e

echo "🚀 Deploying DynaVest Standalone Backend..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

echo "📦 Building and starting services..."

# Build and start services
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for backend to be healthy
timeout=120
counter=0
until curl -f http://localhost:8000/health > /dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -gt $timeout ]; then
        echo "❌ Backend failed to start within $timeout seconds"
        docker-compose logs backend
        exit 1
    fi
    echo "Waiting for backend... ($counter/$timeout seconds)"
done

echo "✅ Backend is ready!"

# Test the API
echo "🧪 Testing API endpoints..."

# Test health endpoint
health_response=$(curl -s http://localhost:8000/health)
echo "Health check: $health_response"

# Test statistics endpoint
stats_response=$(curl -s http://localhost:8000/statistics)
echo "Statistics: $stats_response"

echo ""
echo "🎉 DynaVest Backend deployed successfully!"
echo ""
echo "📊 Available endpoints:"
echo "  - http://localhost:8000/health"
echo "  - http://localhost:8000/strategies"
echo "  - http://localhost:8000/statistics"
echo ""
echo "🔗 Update your frontend NEXT_PUBLIC_SHUTTLE_API_URL to:"
echo "  NEXT_PUBLIC_SHUTTLE_API_URL=http://localhost:8000"
echo ""
echo "📝 To stop the services:"
echo "  docker-compose down"
echo ""
echo "📊 To view logs:"
echo "  docker-compose logs -f backend"