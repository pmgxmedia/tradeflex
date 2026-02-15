#!/bin/bash
# Production Build Script for EStore Application
# This script builds both frontend and backend for production deployment

set -e  # Exit on error

echo "================================================"
echo "  EStore Production Build Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the estore directory.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
rm -rf dist
rm -rf backend/node_modules/.cache
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing frontend dependencies...${NC}"
npm install --production=false
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Building frontend for production...${NC}"
npm run build
if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Frontend build failed - dist directory not created${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing backend dependencies...${NC}"
cd backend
npm install --production
cd ..
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Creating deployment package...${NC}"
mkdir -p deploy
cp -r dist deploy/
cp -r backend deploy/
cp ecosystem.config.cjs deploy/
cp -r backend/.env.production deploy/backend/.env.example
echo -e "${GREEN}✓ Deployment package created in ./deploy${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}Build completed successfully!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Upload the 'deploy' folder to your server"
echo "2. Set up environment variables in backend/.env"
echo "3. Run 'pm2 start ecosystem.config.cjs' to start the backend"
echo "4. Configure Nginx to serve the frontend from dist/"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions"
