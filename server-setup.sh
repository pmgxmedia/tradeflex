#!/bin/bash
# Server Setup Script for Ubuntu/Debian VPS
# Run this script on your fresh VPS to install all required software

set -e  # Exit on error

echo "================================================"
echo "  EStore Server Setup Script"
echo "  For Ubuntu 20.04+ / Debian 11+"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Please do not run this script as root.${NC}"
    echo "Run as a regular user with sudo privileges."
    exit 1
fi

echo -e "${YELLOW}This script will install:${NC}"
echo "- Node.js 20.x LTS"
echo "- Nginx web server"
echo "- PM2 process manager"
echo "- Git version control"
echo "- Certbot (Let's Encrypt SSL)"
echo "- UFW firewall"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

echo -e "${YELLOW}Step 2: Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
echo -e "${GREEN}✓ Node.js installed${NC}"
echo ""

echo -e "${YELLOW}Step 3: Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
echo -e "${GREEN}✓ Nginx installed and started${NC}"
echo ""

echo -e "${YELLOW}Step 4: Installing PM2...${NC}"
sudo npm install -g pm2
echo "PM2 version: $(pm2 -v)"
echo -e "${GREEN}✓ PM2 installed${NC}"
echo ""

echo -e "${YELLOW}Step 5: Installing Git...${NC}"
sudo apt install -y git
echo "Git version: $(git --version)"
echo -e "${GREEN}✓ Git installed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Installing Certbot for SSL...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot installed${NC}"
echo ""

echo -e "${YELLOW}Step 7: Configuring firewall...${NC}"
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
echo "y" | sudo ufw enable
sudo ufw status
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}Step 8: Creating application directory...${NC}"
sudo mkdir -p /var/www/tradeflex
sudo chown -R $USER:$USER /var/www/tradeflex
echo -e "${GREEN}✓ Directory created: /var/www/tradeflex${NC}"
echo ""

echo -e "${YELLOW}Step 9: Creating PM2 logs directory...${NC}"
mkdir -p /var/www/tradeflex/logs
echo -e "${GREEN}✓ Logs directory created${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}Server setup completed successfully!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload your application to /var/www/tradeflex/"
echo "2. Configure backend environment variables (.env)"
echo "3. Copy nginx.conf to /etc/nginx/sites-available/tradeflex"
echo "4. Enable the site: sudo ln -s /etc/nginx/sites-available/tradeflex /etc/nginx/sites-enabled/"
echo "5. Test nginx config: sudo nginx -t"
echo "6. Restart nginx: sudo systemctl restart nginx"
echo "7. Start backend: cd /var/www/tradeflex && pm2 start ecosystem.config.cjs"
echo "8. Setup SSL: sudo certbot --nginx -d tradeflex.online -d www.tradeflex.online"
echo ""
echo -e "${YELLOW}Helpful commands:${NC}"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View application logs"
echo "  sudo nginx -t       - Test nginx configuration"
echo "  sudo ufw status     - Check firewall status"
echo ""
