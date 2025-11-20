#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║   🇬🇳  GUINIUS ENGINE                     ║"
echo "║   Railway Deployment Script               ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo "Install it with: npm i -g @railway/cli"
    exit 1
fi

if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Login with: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"

# Step 2: Verify we're in the right directory
echo -e "${YELLOW}[2/7] Verifying project structure...${NC}"

if [ ! -f "api/server.js" ] || [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Missing required files${NC}"
    echo "Expected: api/server.js, package.json"
    exit 1
fi

echo -e "${GREEN}✅ Project structure valid${NC}"

# Step 3: Link to Railway project
echo -e "${YELLOW}[3/7] Linking to Railway project...${NC}"

railway link

echo -e "${GREEN}✅ Linked to Railway project${NC}"

# Step 4: Initialize service
echo -e "${YELLOW}[4/7] Initializing soussou-engine service...${NC}"

# Check if service already exists
if railway status 2>&1 | grep -q "soussou-engine"; then
    echo -e "${BLUE}ℹ️  Service 'soussou-engine' already exists${NC}"
else
    echo -e "${BLUE}Creating new service...${NC}"
    railway init
fi

echo -e "${GREEN}✅ Service initialized${NC}"

# Step 5: Deploy
echo -e "${YELLOW}[5/7] Deploying to Railway...${NC}"

railway up

echo -e "${GREEN}✅ Deployment complete${NC}"

# Step 6: Set environment variables
echo -e "${YELLOW}[6/7] Setting environment variables...${NC}"

# Set PORT (Railway provides this automatically but good to be explicit)
railway variables set PORT=3000

echo -e "${GREEN}✅ Environment variables set${NC}"

# Step 7: Verify deployment
echo -e "${YELLOW}[7/7] Verifying deployment...${NC}"

sleep 3  # Give Railway a moment to start

railway status

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}║   ✅ DEPLOYMENT SUCCESSFUL                ║${NC}"
echo -e "${GREEN}║                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Check logs: ${YELLOW}railway logs${NC}"
echo "2. Open service: ${YELLOW}railway open${NC}"
echo "3. Test endpoint: ${YELLOW}curl https://your-domain.railway.app/api/stats${NC}"
echo ""
echo -e "${BLUE}To update GPT schema, add these endpoints:${NC}"
echo "  - GET  /api/lookup?word={word}"
echo "  - GET  /api/lookup/phrase?phrase={text}"
echo "  - POST /api/translate"
echo "  - POST /api/generate"
echo "  - POST /api/normalize"
echo "  - GET  /api/patterns"
echo "  - GET  /api/stats"
echo "  - POST /api/contribute"
echo "  - POST /api/feedback"
echo ""
