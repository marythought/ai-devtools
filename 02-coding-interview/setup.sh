#!/bin/bash

echo "🚀 Setting up Coding Interview Platform..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Start Docker services
echo "🐳 Starting Docker services (PostgreSQL + Redis)..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose up -d
else
    echo "❌ Neither 'docker-compose' nor 'docker compose' command found"
    exit 1
fi
if [ $? -ne 0 ]; then
    echo "❌ Failed to start Docker services"
    exit 1
fi
echo "✅ Docker services started"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Setup backend environment
echo "⚙️  Setting up backend environment..."
cd packages/backend
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "ℹ️  .env file already exists"
fi

# Generate Prisma client and run migrations
echo "🗄️  Setting up database..."
npm run db:generate
npm run db:migrate
if [ $? -ne 0 ]; then
    echo "❌ Failed to setup database"
    exit 1
fi
echo "✅ Database setup complete"
cd ../..
echo ""

echo "🎉 Setup complete!"
echo ""
echo "To start the development servers, run:"
echo "  npm run dev"
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Backend will be available at: http://localhost:3001"
echo ""
echo "To stop Docker services, run:"
echo "  npm run docker:down"
