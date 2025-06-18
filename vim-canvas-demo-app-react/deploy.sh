#!/bin/bash

# ScribeAI VIM Canvas App - Enhanced Deployment Script
# Comprehensive deployment with branch verification and error handling

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_BRANCH="heroku-deploy"
HEROKU_APP="scribeai-vim"
HEROKU_REMOTE="heroku"

# Utility functions
log_info() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

log_step() {
    echo -e "\n${BOLD}${BLUE}▶${NC} $1"
}

# Print header
print_header() {
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║               ScribeAI VIM - Deploy Script                  ║"
    echo "║                 Enhanced Deployment v2.0                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed or not in PATH"
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir &> /dev/null; then
        log_error "Not in a git repository"
        exit 1
    fi
    
    # Check if Heroku CLI is installed
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI is not installed"
        echo "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Check Heroku login
    if ! heroku whoami &> /dev/null; then
        log_warning "Not logged in to Heroku"
        echo "Please log in to Heroku:"
        heroku login
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed or not in PATH"
        exit 1
    fi
    
    log_success "All prerequisites checked"
}

# Check current branch
check_branch() {
    log_step "Checking Git Branch"
    
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $current_branch"
    
    if [ "$current_branch" != "$DEPLOY_BRANCH" ]; then
        log_warning "Not on deployment branch ($DEPLOY_BRANCH)"
        read -p "Switch to $DEPLOY_BRANCH? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if git show-ref --verify --quiet refs/heads/$DEPLOY_BRANCH; then
                git checkout $DEPLOY_BRANCH
                log_success "Switched to $DEPLOY_BRANCH"
            else
                log_error "Branch $DEPLOY_BRANCH does not exist"
                exit 1
            fi
        else
            log_error "Deployment cancelled"
            exit 1
        fi
    else
        log_success "On correct deployment branch"
    fi
}

# Check working directory status
check_working_directory() {
    log_step "Checking Working Directory"
    
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Working directory has uncommitted changes"
        git status --short
        
        read -p "Commit changes before deploying? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_message
            if [ -z "$commit_message" ]; then
                commit_message="Pre-deploy commit $(date '+%Y-%m-%d %H:%M:%S')"
            fi
            git add .
            git commit -m "$commit_message"
            log_success "Changes committed"
        else
            log_warning "Proceeding with uncommitted changes"
        fi
    else
        log_success "Working directory is clean"
    fi
}

# Run pre-deploy checks
run_pre_deploy_checks() {
    log_step "Running Pre-Deploy Checks"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Run TypeScript check
    log_info "Running TypeScript check..."
    if npm run type-check &> /dev/null || npx tsc --noEmit &> /dev/null; then
        log_success "TypeScript check passed"
    else
        log_error "TypeScript check failed"
        echo "Please fix TypeScript errors before deploying"
        exit 1
    fi
    
    # Run build test
    log_info "Testing build..."
    if npm run build &> /dev/null; then
        log_success "Build test passed"
    else
        log_error "Build test failed"
        echo "Please fix build errors before deploying"
        exit 1
    fi
    
    log_success "All pre-deploy checks passed"
}

# Check Heroku remote
check_heroku_remote() {
    log_step "Checking Heroku Configuration"
    
    if ! git remote get-url $HEROKU_REMOTE &> /dev/null; then
        log_warning "Heroku remote '$HEROKU_REMOTE' not configured"
        log_info "Adding Heroku remote..."
        heroku git:remote -a $HEROKU_APP
        git remote rename heroku $HEROKU_REMOTE
        log_success "Heroku remote added"
    else
        log_success "Heroku remote configured"
    fi
    
    # Verify app exists
    if ! heroku apps:info --app $HEROKU_APP &> /dev/null; then
        log_error "Heroku app '$HEROKU_APP' not found or no access"
        exit 1
    fi
    
    log_info "Deploying to: $HEROKU_APP"
}

# Deploy to Heroku
deploy_to_heroku() {
    log_step "Deploying to Heroku"
    
    log_info "Pushing to Heroku..."
    
    # Show what we're about to deploy
    echo "Latest commits to be deployed:"
    git log --oneline -5
    echo
    
    # Push to Heroku
    if git push $HEROKU_REMOTE $DEPLOY_BRANCH:main --force; then
        log_success "Deployment successful!"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Show deployment info
show_deployment_info() {
    log_step "Deployment Information"
    
    # Get app URL
    app_url=$(heroku apps:info --app $HEROKU_APP | grep "Web URL" | awk '{print $3}')
    
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     Deployment Complete!                    ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}App URL:${NC} $app_url"
    echo -e "${BLUE}Git Commit:${NC} $(git rev-parse --short HEAD)"
    echo -e "${BLUE}Branch:${NC} $DEPLOY_BRANCH"
    echo -e "${BLUE}Heroku App:${NC} $HEROKU_APP"
    echo -e "${BLUE}Deployed At:${NC} $(date)"
    
    # Ask if user wants to open the app
    read -p "Open app in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        heroku open --app $HEROKU_APP
    fi
}

# Rollback function
show_rollback_info() {
    echo -e "\n${YELLOW}${BOLD}Rollback Information:${NC}"
    echo "If you need to rollback this deployment:"
    echo "1. heroku releases --app $HEROKU_APP"
    echo "2. heroku rollback v[VERSION] --app $HEROKU_APP"
    echo "3. Or use: git push $HEROKU_REMOTE [PREVIOUS_COMMIT]:main --force"
}

# Main execution
main() {
    print_header
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --branch)
                DEPLOY_BRANCH="$2"
                shift 2
                ;;
            --app)
                HEROKU_APP="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-checks    Skip pre-deploy checks"
                echo "  --branch BRANCH  Deploy from specific branch (default: $DEPLOY_BRANCH)"
                echo "  --app APP        Deploy to specific Heroku app (default: $HEROKU_APP)"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_prerequisites
    check_branch
    check_working_directory
    
    if [ "$SKIP_CHECKS" != true ]; then
        run_pre_deploy_checks
    fi
    
    check_heroku_remote
    deploy_to_heroku
    show_deployment_info
    show_rollback_info
    
    log_success "Deployment script completed successfully!"
}

# Run main function with all arguments
main "$@" 