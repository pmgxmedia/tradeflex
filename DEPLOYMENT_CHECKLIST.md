# Quick Deployment Checklist for www.tradeflex.online

## Pre-Deployment (Do This First)

### 1. Database Setup
- [ ] Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
- [ ] Create a new cluster (free tier available)
- [ ] Create database user with username and password
- [ ] Add IP whitelist: 0.0.0.0/0 (or your server IP)
- [ ] Get connection string and save it

### 2. Contact domains.co.za
- [ ] Confirm your hosting type (VPS/Cloud recommended)
- [ ] Ensure Node.js support (version 18+)
- [ ] Request SSH access if you don't have it
- [ ] Get your server IP address
- [ ] Verify you can access cPanel or server via SSH

### 3. Local Build Preparation
- [ ] Run `build-production.bat` (Windows) or `build-production.sh` (Linux/Mac)
- [ ] Verify `deploy` folder is created with:
  - dist/ (frontend build)
  - backend/ (backend code)
  - ecosystem.config.cjs

---

## VPS/Cloud Server Deployment (Recommended)

### Step 1: Server Access
```bash
ssh your_username@YOUR_SERVER_IP
```

### Step 2: Install Required Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git (optional, for version control)
sudo apt install -y git
```

### Step 3: Upload Your Application
```bash
# Option A: Using SCP from your local machine
scp -r E:\EStock\estore\deploy your_username@YOUR_SERVER_IP:/var/www/tradeflex

# Option B: Using Git (if you push to GitHub first)
cd /var/www
sudo git clone YOUR_GITHUB_REPO tradeflex
cd tradeflex/estore
npm install
npm run build
```

### Step 4: Configure Backend Environment
```bash
cd /var/www/tradeflex/backend
nano .env
```

Copy and fill in from `.env.production`:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/estore
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
CLIENT_URL=https://www.tradeflex.online
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Start Backend with PM2
```bash
cd /var/www/tradeflex
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # Follow the command it outputs
```

### Step 6: Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/tradeflex
```

Copy content from `nginx.conf` file, then:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/tradeflex /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Step 7: Configure DNS
In domains.co.za control panel:
1. Add A record for `@` → Your server IP
2. Add A record for `www` → Your server IP
3. Add A record for `api` → Your server IP

Wait 1-24 hours for DNS propagation

### Step 8: Setup SSL (HTTPS)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d tradeflex.online -d www.tradeflex.online -d api.tradeflex.online

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 9: Configure Firewall
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

### Step 10: Test Your Site
- Visit: https://www.tradeflex.online
- API: https://api.tradeflex.online
- Register a test user
- Test all functionality

---

## cPanel/Shared Hosting Deployment

### Step 1: Upload Files
1. Log into cPanel at domains.co.za
2. Use File Manager or FileZilla
3. Upload entire `deploy` folder to `public_html/`

### Step 2: Setup Node.js App (if available)
1. Go to "Setup Node.js App" in cPanel
2. Create new app:
   - Node version: 20.x
   - App root: `public_html/deploy/backend`
   - App URL: `api` subdomain
   - Startup file: `server.js`
3. Add environment variables from `.env.production`
4. Start the application

### Step 3: Deploy Frontend
```bash
# Via cPanel Terminal or SSH
cd ~/public_html
cp -r deploy/dist/* .
```

### Step 4: Configure .htaccess
Upload `.htaccess` file to `public_html/`

### Step 5: Setup SSL
1. Go to cPanel → SSL/TLS
2. Enable AutoSSL or Let's Encrypt
3. Force HTTPS redirect

---

## Post-Deployment Testing

### Test Checklist
- [ ] Homepage loads: https://www.tradeflex.online
- [ ] API responds: https://api.tradeflex.online (or /api)
- [ ] User registration works
- [ ] User login works
- [ ] Products display correctly
- [ ] Add to cart works
- [ ] Checkout process works
- [ ] Admin login works
- [ ] Admin dashboard accessible
- [ ] Product management works
- [ ] Order management works
- [ ] Real-time inventory updates (WebSocket)
- [ ] Email notifications (if configured)
- [ ] All images load correctly
- [ ] Mobile responsive design works

### Monitor Logs
```bash
# Backend logs
pm2 logs estore-backend

# Nginx access logs
sudo tail -f /var/log/nginx/tradeflex.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/tradeflex.error.log
```

---

## Common Issues & Solutions

### Issue: "502 Bad Gateway"
**Solution**: Backend not running
```bash
pm2 status
pm2 restart estore-backend
pm2 logs estore-backend
```

### Issue: "Database connection failed"
**Solution**: 
- Verify MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas
- Test connection: `node -e "require('mongoose').connect('YOUR_URI').then(() => console.log('OK'))"`

### Issue: "CORS errors in browser console"
**Solution**: 
- Check `CLIENT_URL` in backend `.env` matches frontend domain
- Verify Nginx proxy headers are set correctly

### Issue: "API requests return 404"
**Solution**:
- Check frontend `.env` has correct `VITE_API_URL`
- Verify Nginx proxy configuration for `/api`
- Ensure backend is running: `pm2 status`

### Issue: "WebSocket/Socket.IO not connecting"
**Solution**:
- Check Nginx WebSocket proxy configuration
- Verify `socket.io` location block in nginx.conf
- Test backend directly: http://YOUR_IP:5000

### Issue: "Images not loading"
**Solution**:
- Verify images are uploaded to server
- Check image URLs in database
- Consider using Cloudinary for image hosting

---

## Maintenance Tasks

### Update Application
```bash
# SSH to server
cd /var/www/tradeflex

# Pull latest code (if using Git)
git pull

# Backend updates
cd backend
npm install
pm2 restart estore-backend

# Frontend updates
cd ..
npm install
npm run build
```

### Backup Database
```bash
# From MongoDB Atlas
# Database Access → Backup → Manual Backup

# Or using mongodump (from server)
mongodump --uri="YOUR_MONGODB_URI" --out=/backups/estore-$(date +%Y%m%d)
```

### Monitor Server Resources
```bash
# CPU and memory usage
htop

# PM2 monitoring
pm2 monit

# Disk usage
df -h
```

### View Application Logs
```bash
pm2 logs estore-backend --lines 100
pm2 logs estore-backend --err  # Errors only
```

---

## Security Checklist
- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Restrict MongoDB IP whitelist to server IP only
- [ ] Enable firewall (UFW)
- [ ] Force HTTPS (redirect HTTP to HTTPS)
- [ ] Set secure cookie settings
- [ ] Regular backups of database
- [ ] Keep Node.js and packages updated
- [ ] Monitor server logs for suspicious activity
- [ ] Use environment variables for all secrets
- [ ] Disable directory listing
- [ ] Set proper file permissions (644 for files, 755 for directories)

---

## Support Resources

### domains.co.za
- Support: https://www.domains.co.za/support
- cPanel guide: Check their knowledge base
- SSH access: Request from support if needed

### MongoDB Atlas
- Docs: https://docs.atlas.mongodb.com/
- Support: https://www.mongodb.com/support

### General
- PM2 docs: https://pm2.keymetrics.io/
- Nginx docs: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/

---

## Emergency Contacts
- domains.co.za Support: support@domains.co.za
- Your server IP: _________________
- MongoDB connection: _________________
- Admin email: _________________

---

**Estimated Deployment Time**: 2-4 hours (first time)

Good luck! 🚀
