# EStore - Deployment Package for www.tradeflex.online

## 📦 What's Included

This is a complete deployment package for your EStore e-commerce application.

### Application Features
- ✅ Full-stack MERN application (MongoDB, Express, React, Node.js)
- ✅ Real-time inventory monitoring with WebSocket
- ✅ Admin dashboard with analytics
- ✅ User authentication & authorization
- ✅ Product management (CRUD)
- ✅ Order processing & tracking
- ✅ Shopping cart functionality
- ✅ Email notifications
- ✅ Responsive design (mobile-friendly)

### Deployment Files
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment instructions
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `TROUBLESHOOTING.md` - Common issues and solutions
- `ecosystem.config.cjs` - PM2 process manager configuration
- `nginx.conf` - Nginx web server configuration
- `.htaccess` - Apache configuration (for cPanel)
- `build-production.bat/sh` - Build scripts
- `.env.production` - Environment variable templates

---

## 🚀 Quick Start

### 1. Choose Your Deployment Method

#### Option A: VPS/Cloud Server (Recommended)
- Full control over server
- Better performance
- Real-time features work perfectly
- See: `DEPLOYMENT_GUIDE.md` → Option A

#### Option B: cPanel/Shared Hosting
- Simpler setup
- Less control
- May have limitations
- See: `DEPLOYMENT_GUIDE.md` → Option B

### 2. Prepare Your Environment

**You'll need**:
- Domain: www.tradeflex.online (already registered with domains.co.za)
- Hosting account (VPS or cPanel)
- MongoDB Atlas account (free tier available)

### 3. Build for Production

**On your local machine** (Windows):
```bash
# Navigate to estore folder
cd E:\EStock\estore

# Run build script
build-production.bat
```

This creates a `deploy` folder with everything you need.

### 4. Follow the Deployment Checklist

Open `DEPLOYMENT_CHECKLIST.md` and follow each step carefully.

**Estimated time**: 2-4 hours (first deployment)

---

## 📋 Pre-Deployment Requirements

### Required Services

1. **MongoDB Database**
   - Create free account at: https://www.mongodb.com/cloud/atlas
   - Create cluster (free tier M0)
   - Get connection string
   - Cost: FREE

2. **domains.co.za Hosting**
   - You already have: www.tradeflex.online
   - Verify hosting type (VPS/cPanel)
   - Ensure Node.js support
   - Get SSH access (VPS) or cPanel access

### Optional Services (can add later)

3. **Email Service** (for notifications)
   - Gmail (free, 500 emails/day)
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)

4. **Image Hosting** (optional)
   - Cloudinary (free tier: 25GB)
   - AWS S3
   - Currently: images stored as base64 in database

5. **Payment Gateway** (when ready)
   - Stripe (https://stripe.com)
   - PayPal (https://paypal.com)

---

## 🔧 Configuration Overview

### Backend Environment Variables

Create `backend/.env` on your server:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/estore
JWT_SECRET=your_very_strong_secret_key_64_chars_minimum
CLIENT_URL=https://www.tradeflex.online
```

**Critical**: 
- Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Never commit .env files to Git
- Use actual MongoDB connection string from Atlas

### Frontend Environment Variables

Create `.env` in frontend root:
```env
# For VPS deployment with separate API subdomain
VITE_API_URL=https://api.tradeflex.online/api

# For cPanel deployment (same domain)
# VITE_API_URL=https://www.tradeflex.online/api
```

---

## 📁 File Structure After Deployment

### VPS/Cloud Server
```
/var/www/tradeflex/
├── estore/
│   ├── dist/                    # Frontend (built)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── ...
│   ├── backend/                 # Backend
│   │   ├── server.js
│   │   ├── .env                 # YOUR CONFIGURATION
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── ...
│   └── ecosystem.config.cjs     # PM2 config
```

### cPanel/Shared Hosting
```
~/public_html/
├── index.html                   # Frontend files (from dist/)
├── assets/
├── .htaccess                    # Apache config
└── backend/                     # Backend (if Node.js available)
    ├── server.js
    ├── .env
    └── ...
```

---

## 🌐 Domain & DNS Configuration

### DNS Records (Configure in domains.co.za)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | YOUR_SERVER_IP | 14400 |
| A | www | YOUR_SERVER_IP | 14400 |
| A | api | YOUR_SERVER_IP | 14400 |

**Note**: DNS propagation can take 1-48 hours

### Testing DNS Propagation
```bash
# Check if DNS is updated
nslookup tradeflex.online
nslookup www.tradeflex.online
nslookup api.tradeflex.online

# Or use online tool
# https://www.whatsmydns.net/
```

---

## 🔒 Security Checklist

Before going live:
- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (64+ characters)
- [ ] Restrict MongoDB IP whitelist
- [ ] Enable HTTPS/SSL (Let's Encrypt)
- [ ] Configure firewall (UFW on Ubuntu)
- [ ] Set secure environment variables
- [ ] Never expose .env files
- [ ] Use strong admin passwords
- [ ] Enable CORS only for your domain
- [ ] Regular database backups
- [ ] Keep dependencies updated

---

## 🧪 Testing Your Deployment

### Functional Tests
```
✓ Homepage loads: https://www.tradeflex.online
✓ API responds: https://api.tradeflex.online
✓ User registration works
✓ User login works
✓ Products display
✓ Add to cart works
✓ Checkout process
✓ Admin dashboard accessible
✓ Product management (CRUD)
✓ Order management
✓ Real-time updates (WebSocket)
✓ Email notifications
✓ All images load
✓ Mobile responsive
```

### Performance Tests
- Google PageSpeed Insights
- GTmetrix
- Pingdom
- WebPageTest

---

## 📊 Monitoring & Maintenance

### Check Application Health
```bash
# Backend status
pm2 status

# View logs
pm2 logs estore-backend

# Monitor resources
pm2 monit

# Server resources
htop
df -h
```

### Regular Maintenance Tasks
- **Daily**: Check application logs
- **Weekly**: Review analytics, check error logs
- **Monthly**: Update dependencies, database backup
- **Quarterly**: Security audit, performance review

### Backup Strategy
1. **Database**: MongoDB Atlas auto-backups (if enabled)
2. **Code**: Git repository
3. **Images**: Regular backup if storing locally
4. **Environment**: Backup .env files securely

---

## 🆘 Getting Help

### Order of Resources
1. **Start here**: `DEPLOYMENT_CHECKLIST.md`
2. **Detailed guide**: `DEPLOYMENT_GUIDE.md`
3. **Having issues?**: `TROUBLESHOOTING.md`
4. **Still stuck?**: Contact support

### Support Contacts
- **Hosting**: domains.co.za support
- **Database**: MongoDB Atlas support
- **Technical**: Stack Overflow (tag: node.js, nginx, mongodb)

### Useful Commands
```bash
# View all services status
sudo systemctl status nginx
pm2 status

# View logs
pm2 logs estore-backend --lines 100
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart estore-backend
sudo systemctl restart nginx

# Test configurations
sudo nginx -t
pm2 list
```

---

## 📈 Post-Deployment Optimization

### Performance Tips
1. Enable Gzip compression (included in nginx.conf)
2. Use CDN for static assets
3. Optimize images (WebP format, compression)
4. Implement caching (Redis)
5. Database indexing
6. Enable HTTP/2
7. Lazy load components

### SEO Optimization
1. Add meta tags (update SEO.jsx component)
2. Create sitemap.xml
3. Add robots.txt
4. Submit to Google Search Console
5. Add schema markup
6. Optimize page titles and descriptions

### Analytics Integration
1. Google Analytics
2. Google Tag Manager
3. Facebook Pixel
4. Hotjar or similar for heatmaps

---

## 🔄 Updating Your Application

### After Initial Deployment
```bash
# SSH to your server
ssh user@tradeflex.online

# Navigate to application
cd /var/www/tradeflex/estore

# Pull latest changes (if using Git)
git pull

# Update backend
cd backend
npm install
pm2 restart estore-backend

# Update frontend
cd ..
npm install
npm run build

# Done! Changes are live
```

---

## 💰 Cost Estimate

### Free Tier (Suitable for MVP/Testing)
- MongoDB Atlas: FREE (M0 cluster, 512MB storage)
- Let's Encrypt SSL: FREE
- domains.co.za hosting: PAID (your existing plan)
- Gmail SMTP: FREE (500 emails/day limit)
- Cloudinary: FREE (25GB storage, 25GB bandwidth)

**Total**: Just your domains.co.za hosting cost

### Production Tier (Recommended for live business)
- MongoDB Atlas: $9-57/month (M10-M30 cluster)
- domains.co.za VPS: R199-R999/month
- SendGrid/Mailgun: R0-R500/month
- Cloudinary Pro: R450/month
- Stripe fees: 2.9% + R3 per transaction

**Estimated**: R650-2500/month depending on traffic

---

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Website loads at https://www.tradeflex.online
- ✅ All pages navigate correctly
- ✅ Users can register and login
- ✅ Products display with images
- ✅ Shopping cart functions properly
- ✅ Orders can be placed
- ✅ Admin panel is accessible
- ✅ Real-time inventory updates work
- ✅ Email notifications send correctly
- ✅ HTTPS is enabled and working
- ✅ No console errors in browser
- ✅ Mobile version works well

---

## 📚 Additional Resources

### Documentation Files
- `DEPLOYMENT_GUIDE.md` - Full deployment walkthrough
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist
- `TROUBLESHOOTING.md` - Problem solving guide
- `docs/SETUP_GUIDE.md` - Initial setup
- `docs/QUICKSTART.md` - Quick start guide

### Official Documentation
- React: https://react.dev/
- Express: https://expressjs.com/
- MongoDB: https://docs.mongodb.com/
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/

### Helpful Tools
- MongoDB Atlas: https://cloud.mongodb.com/
- Let's Encrypt: https://letsencrypt.org/
- SSL Test: https://www.ssllabs.com/ssltest/
- DNS Checker: https://www.whatsmydns.net/
- PageSpeed: https://pagespeed.web.dev/

---

## 🎉 Ready to Deploy?

1. **Review** this README
2. **Read** `DEPLOYMENT_CHECKLIST.md`
3. **Prepare** MongoDB Atlas account
4. **Run** `build-production.bat`
5. **Follow** the checklist step-by-step
6. **Test** everything thoroughly
7. **Go live!**

**Good luck with your deployment!** 🚀

---

## 📞 Support

Need help? Check these resources in order:
1. TROUBLESHOOTING.md file
2. DEPLOYMENT_GUIDE.md file
3. domains.co.za support: support@domains.co.za
4. MongoDB Atlas docs: https://docs.atlas.mongodb.com/

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Application**: EStore E-commerce Platform  
**Domain**: www.tradeflex.online  
**Hosting**: domains.co.za
