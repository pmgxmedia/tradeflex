# Deployment Guide: EStock to www.tradeflex.online (domains.co.za)

## Overview
This guide will help you deploy your full-stack EStock application (React frontend + Node.js backend) to www.tradeflex.online hosted on domains.co.za.

## Prerequisites
- Domain: www.tradeflex.online (registered with domains.co.za)
- Hosting account with domains.co.za (VPS, Cloud, or cPanel hosting)
- MongoDB database (MongoDB Atlas recommended)
- SSH access to your server (if VPS/Cloud hosting)

---

## Table of Contents
1. [Choose Your Hosting Type](#1-choose-your-hosting-type)
2. [Database Setup (MongoDB Atlas)](#2-database-setup-mongodb-atlas)
3. [Option A: VPS/Cloud Server Deployment](#option-a-vpscloud-server-deployment)
4. [Option B: cPanel/Shared Hosting Deployment](#option-b-cpanelshared-hosting-deployment)
5. [Domain Configuration](#5-domain-configuration)
6. [SSL Certificate Setup](#6-ssl-certificate-setup)
7. [Post-Deployment Checklist](#7-post-deployment-checklist)

---

## 1. Choose Your Hosting Type

domains.co.za offers different hosting types. Determine which you have:

- **VPS/Cloud Server**: Full server control, Node.js support (RECOMMENDED)
- **cPanel/Shared Hosting**: Limited control, may need workarounds
- **WordPress Hosting**: Not suitable for this application

For this application, **VPS or Cloud hosting is strongly recommended**.

---

## 2. Database Setup (MongoDB Atlas)

Since domains.co.za may not offer MongoDB hosting, use MongoDB Atlas (free tier available):

### Steps:
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose a region close to South Africa)
4. Create a database user:
   - Username: `estore_admin`
   - Password: Generate a strong password (save it!)
5. Whitelist IP addresses:
   - Click "Network Access"
   - Add IP Address: `0.0.0.0/0` (allows access from anywhere - for simplicity)
   - Or add your server's specific IP for better security
6. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://estore_admin:<password>@cluster0.xxxxx.mongodb.net/estore?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Replace `estore` with your database name if different

---

## Option A: VPS/Cloud Server Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux server
- SSH access
- Root or sudo privileges

### Step 1: Server Preparation

SSH into your server:
```bash
ssh your_username@tradeflex.online
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js

```bash
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 3: Install Nginx (Web Server)

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 5: Upload Your Application

Option 1: Using Git (Recommended)
```bash
# If your code is on GitHub/GitLab
cd /var/www
sudo git clone https://github.com/yourusername/estock.git tradeflex
cd tradeflex/estore
```

Option 2: Using SCP/FileZilla
```bash
# From your local machine
scp -r E:\EStock\estore your_username@tradeflex.online:/var/www/tradeflex
```

### Step 6: Setup Backend

```bash
cd /var/www/tradeflex/estore/backend

# Install dependencies
npm install --production

# Create production .env file
sudo nano .env
```

Add the following to `.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database - Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://estore_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/estore?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=GENERATE_A_VERY_STRONG_SECRET_KEY_HERE
JWT_EXPIRE=30d

# CORS - Your frontend URL
CLIENT_URL=https://www.tradeflex.online

# Email Service (configure if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Important**: Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save and exit (Ctrl+X, Y, Enter)

### Step 7: Setup Frontend

```bash
cd /var/www/tradeflex/estore

# Install dependencies
npm install

# Create production .env file
sudo nano .env
```

Add to frontend `.env`:
```env
VITE_API_URL=https://api.tradeflex.online/api
```

Build the frontend:
```bash
npm run build
```

This creates a `dist` folder with your production-ready frontend.

### Step 8: Start Backend with PM2

```bash
cd /var/www/tradeflex/estore/backend

# Start the backend
pm2 start server.js --name estore-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Follow the command it outputs
```

Verify backend is running:
```bash
pm2 status
pm2 logs estore-backend
```

### Step 9: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/tradeflex
```

Add this configuration:
```nginx
# API Server (Backend)
server {
    listen 80;
    server_name api.tradeflex.online;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend (Main Website)
server {
    listen 80;
    server_name tradeflex.online www.tradeflex.online;

    root /var/www/tradeflex/estore/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site and restart Nginx:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tradeflex /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 10: Setup SSL Certificate (HTTPS)

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Get SSL certificates:
```bash
# For main domain
sudo certbot --nginx -d tradeflex.online -d www.tradeflex.online

# For API subdomain
sudo certbot --nginx -d api.tradeflex.online
```

Follow the prompts. Certbot will automatically configure HTTPS.

Test auto-renewal:
```bash
sudo certbot renew --dry-run
```

### Step 11: Configure Firewall

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Step 12: Test Your Deployment

1. Visit `https://www.tradeflex.online` - should show your frontend
2. Visit `https://api.tradeflex.online` - should show "EStore API is running..."
3. Try registering a user and logging in

---

## Option B: cPanel/Shared Hosting Deployment

**Note**: This is more limited. You'll need Node.js support from domains.co.za.

### Step 1: Check Node.js Support

1. Log into your cPanel
2. Look for "Setup Node.js App" or "Application Manager"
3. If not available, contact domains.co.za support to enable Node.js

### Step 2: Upload Files

1. Use cPanel File Manager or FileZilla
2. Upload the entire `estore` folder to `public_html/`

### Step 3: Setup Node.js Application

In cPanel:
1. Go to "Setup Node.js App"
2. Create new application:
   - **Node.js version**: 20.x or latest
   - **Application mode**: Production
   - **Application root**: `public_html/estore/backend`
   - **Application URL**: Choose `api` subdomain
   - **Application startup file**: `server.js`

### Step 4: Setup Environment Variables

In the Node.js app settings, add environment variables:
```
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_secret
CLIENT_URL=https://www.tradeflex.online
```

### Step 5: Build and Deploy Frontend

Via SSH or cPanel Terminal:
```bash
cd ~/public_html/estore
npm install
npm run build

# Move built files to public_html
cp -r dist/* ../
```

Or manually:
1. Build locally: `npm run build`
2. Upload contents of `dist` folder to `public_html/`

### Step 6: Configure .htaccess

Create `.htaccess` in `public_html/`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Proxy API requests to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api/(.*)$
  RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
  
  # Frontend routing
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Domain Configuration

In your domains.co.za control panel:

### DNS Settings:

1. **A Record** for main domain:
   - Type: `A`
   - Name: `@`
   - Value: Your server IP address
   - TTL: 14400

2. **A Record** for www:
   - Type: `A`
   - Name: `www`
   - Value: Your server IP address
   - TTL: 14400

3. **A Record** for API subdomain (if using VPS):
   - Type: `A`
   - Name: `api`
   - Value: Your server IP address
   - TTL: 14400

**Wait 24-48 hours for DNS propagation** (usually faster)

---

## 6. SSL Certificate Setup

### For VPS (using Certbot):
Already covered in Option A, Step 10

### For cPanel:
1. Go to cPanel → SSL/TLS
2. Use AutoSSL or Let's Encrypt (usually free)
3. Enable SSL for your domain

---

## 7. Post-Deployment Checklist

- [ ] Application loads at https://www.tradeflex.online
- [ ] API responds at https://api.tradeflex.online (VPS) or https://www.tradeflex.online/api
- [ ] Can register a new user
- [ ] Can log in successfully
- [ ] Can view products
- [ ] Can add items to cart
- [ ] Can place an order
- [ ] Admin dashboard works
- [ ] Real-time inventory updates work (WebSocket)
- [ ] Email notifications work (if configured)
- [ ] All images load correctly

### Monitor Logs (VPS):
```bash
# Backend logs
pm2 logs estore-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues:

**Issue**: API requests fail with CORS errors
**Solution**: Check `CLIENT_URL` in backend `.env` matches your frontend domain

**Issue**: 502 Bad Gateway
**Solution**: Backend not running. Check `pm2 status` and restart if needed

**Issue**: Database connection failed
**Solution**: Verify MongoDB Atlas connection string and IP whitelist

**Issue**: WebSocket not working
**Solution**: Check Nginx WebSocket proxy configuration

---

## Updating Your Application

### VPS Method:
```bash
# SSH into server
ssh your_username@tradeflex.online

# Backend updates
cd /var/www/tradeflex/estore/backend
git pull  # if using Git
npm install
pm2 restart estore-backend

# Frontend updates
cd /var/www/tradeflex/estore
git pull
npm install
npm run build
```

### Manual Method:
1. Build locally
2. Upload new files via FTP/SCP
3. Restart backend (PM2 or cPanel)

---

## Support

If you encounter issues:
1. Check PM2/application logs
2. Check Nginx error logs
3. Verify environment variables
4. Contact domains.co.za support for server-specific issues
5. Test MongoDB Atlas connection separately

---

## Security Recommendations

1. **Change all default passwords**
2. **Use strong JWT_SECRET** (64+ characters)
3. **Restrict MongoDB Atlas IP whitelist** to your server's IP only
4. **Keep Node.js and packages updated**
5. **Enable firewall** (UFW on Ubuntu)
6. **Regular backups** of MongoDB database
7. **Monitor server resources** (CPU, RAM, disk)
8. **Use HTTPS everywhere** (force SSL)
9. **Set up server monitoring** (UptimeRobot, etc.)
10. **Review Nginx security headers**

---

Good luck with your deployment! 🚀
