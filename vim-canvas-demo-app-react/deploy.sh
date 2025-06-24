#!/bin/bash

# Simple deployment script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting deployment...${NC}"

# Check if we're on heroku-deploy branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" != "heroku-deploy" ]; then
    echo -e "${RED}❌ Must be on heroku-deploy branch. Current: $current_branch${NC}"
    exit 1
fi

# Check if heroku remote exists
if ! git remote get-url heroku &> /dev/null; then
    echo -e "${RED}❌ Heroku remote not found. Run: heroku git:remote -a scribeai-vim${NC}"
    exit 1
fi

# Check if logged into heroku
if ! heroku whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged into Heroku. Run: heroku login${NC}"
    exit 1
fi

# Add all changes
echo -e "${BLUE}📝 Adding changes...${NC}"
git add .

# Check if there are changes to commit
if [ -n "$(git status --porcelain)" ]; then
    # Commit with timestamp
    commit_msg="Deploy $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${BLUE}💾 Committing: $commit_msg${NC}"
    git commit -m "$commit_msg"
else
    echo -e "${BLUE}ℹ️  No changes to commit${NC}"
fi

# Push to origin
echo -e "${BLUE}⬆️  Pushing to origin...${NC}"
git push origin heroku-deploy

# Show what we're about to deploy
echo -e "${YELLOW}📋 Latest commit to deploy:${NC}"
git log --oneline -1

# Simple confirmation
read -p "Deploy to Heroku? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
    exit 0
fi

# Push to heroku
echo -e "${BLUE}🚀 Deploying to Heroku...${NC}"
git push heroku heroku-deploy:main --force

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 App URL: https://scribeai-vim.herokuapp.com${NC}" 