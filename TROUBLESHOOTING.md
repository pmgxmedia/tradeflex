# Deployment Troubleshooting Guide

## Table of Contents
1. [Connection Issues](#connection-issues)
2. [Build Errors](#build-errors)
3. [Server Errors](#server-errors)
4. [Database Issues](#database-issues)
5. [SSL/HTTPS Issues](#sslhttps-issues)
6. [Performance Issues](#performance-issues)
7. [Email Issues](#email-issues)

---

## Connection Issues

### Cannot SSH into server
**Symptoms**: Connection timeout or refused when trying to SSH

**Solutions**:
1. Verify server IP address is correct
2. Check if SSH port is 22 or custom port
3. Ensure firewall allows SSH:
   ```bash
   sudo ufw status
   sudo ufw allow OpenSSH
   ```
4. Contact domains.co.za support to verify SSH is enabled
5. Try using cPanel terminal instead

### Cannot access website (404 or timeout)
**Symptoms**: Website not loading at all

**Diagnostic Steps**:
```bash
# Check if server is running
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test if port 80/443 are open
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Check DNS resolution
nslookup tradeflex.online
ping tradeflex.online
```

**Solutions**:
1. Restart Nginx: `sudo systemctl restart nginx`
2. Check Nginx configuration: `sudo nginx -t`
3. Verify DNS settings in domains.co.za control panel
4. Wait for DNS propagation (up to 48 hours)
5. Check firewall allows HTTP/HTTPS:
   ```bash
   sudo ufw allow 'Nginx Full'
   ```

### API requests fail (CORS errors)
**Symptoms**: Browser console shows CORS policy errors

**Check**:
```bash
# View backend logs
pm2 logs estore-backend

# Check if CLIENT_URL is correct
cd /var/www/tradeflex/backend
cat .env | grep CLIENT_URL
```

**Solutions**:
1. Verify `CLIENT_URL` in backend `.env` matches your frontend URL:
   ```env
   CLIENT_URL=https://www.tradeflex.online
   ```
2. Ensure no trailing slash in CLIENT_URL
3. Restart backend: `pm2 restart estore-backend`
4. Clear browser cache and cookies
5. Check Nginx proxy headers in nginx.conf

---

## Build Errors

### Frontend build fails
**Symptoms**: `npm run build` exits with errors

**Common Causes**:
1. **Missing dependencies**: Run `npm install`
2. **Node version mismatch**: Check version with `node -v` (need 18+)
3. **Out of memory**: Increase Node memory:
   ```bash
   export NODE_OPTIONS="--max_old_space_size=4096"
   npm run build
   ```
4. **Syntax errors**: Check the error message for file/line number

**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Backend dependencies fail to install
**Symptoms**: `npm install` fails in backend folder

**Solutions**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Server Errors

### 502 Bad Gateway
**Symptoms**: Nginx shows "502 Bad Gateway" error

**Cause**: Backend server is not running or not accessible

**Diagnostic**:
```bash
# Check if backend is running
pm2 status
pm2 logs estore-backend

# Check if port 5000 is in use
sudo netstat -tulpn | grep :5000

# Try accessing backend directly
curl http://localhost:5000
```

**Solutions**:
1. Start backend:
   ```bash
   cd /var/www/tradeflex
   pm2 start ecosystem.config.cjs
   ```
2. If already running, restart:
   ```bash
   pm2 restart estore-backend
   ```
3. Check for port conflicts
4. Review error logs: `pm2 logs estore-backend --err`

### 500 Internal Server Error
**Symptoms**: API returns 500 errors

**Diagnostic**:
```bash
# Check backend logs
pm2 logs estore-backend --lines 50

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Common Causes**:
1. Database connection failed
2. Missing environment variables
3. Code errors (check stack trace in logs)
4. File permission issues

**Solutions**:
1. Verify all environment variables are set
2. Check database connection
3. Review code for syntax errors
4. Check file permissions:
   ```bash
   sudo chown -R $USER:$USER /var/www/tradeflex
   sudo chmod -R 755 /var/www/tradeflex
   ```

### Backend crashes repeatedly
**Symptoms**: PM2 shows backend restarting over and over

**Diagnostic**:
```bash
pm2 logs estore-backend --err
pm2 describe estore-backend
```

**Common Causes**:
1. Uncaught exceptions in code
2. Memory leaks
3. Database connection issues
4. Missing dependencies

**Solutions**:
1. Fix the error shown in logs
2. Increase memory limit in ecosystem.config.cjs:
   ```javascript
   max_memory_restart: '1G'
   ```
3. Check for process conflicts on port 5000

---

## Database Issues

### Cannot connect to MongoDB
**Symptoms**: "MongoServerError: Authentication failed" or connection timeout

**Diagnostic**:
```bash
# Test connection string
node -e "require('mongoose').connect('YOUR_MONGODB_URI').then(() => console.log('Connected!')).catch(err => console.log('Error:', err.message))"
```

**Solutions**:
1. **Wrong credentials**:
   - Verify username and password in connection string
   - Check if special characters in password are URL-encoded
   - Example: `p@ssw0rd` should be `p%40ssw0rd`

2. **IP not whitelisted**:
   - Go to MongoDB Atlas → Network Access
   - Add your server's IP address
   - Or add `0.0.0.0/0` for testing (not recommended for production)

3. **Wrong connection string**:
   - Verify format: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Ensure database name is included
   - Check for typos

4. **Network issues**:
   - Test internet connectivity from server
   - Check if firewall blocks MongoDB ports (27017)
   - Try using standard connection instead of SRV

### Database operations are slow
**Symptoms**: API requests take a long time

**Solutions**:
1. Add indexes to frequently queried fields
2. Upgrade MongoDB Atlas tier
3. Choose a cluster region closer to your server
4. Optimize database queries (use .select(), .limit())
5. Implement caching (Redis)

---

## SSL/HTTPS Issues

### Certbot fails to get certificate
**Symptoms**: Certbot returns errors

**Common Issues**:
1. **Port 80 not accessible**:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo systemctl restart nginx
   ```

2. **DNS not pointing to server**:
   - Verify A records in domains.co.za
   - Test: `nslookup tradeflex.online`
   - Wait for DNS propagation

3. **Nginx not configured correctly**:
   ```bash
   sudo nginx -t
   ```

**Solution**:
```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Use standalone mode
sudo certbot certonly --standalone -d tradeflex.online -d www.tradeflex.online

# Restart Nginx
sudo systemctl start nginx
```

### Mixed content warnings
**Symptoms**: Browser shows "Not Secure" or mixed content warnings

**Cause**: Loading HTTP resources on HTTPS page

**Solutions**:
1. Ensure all API calls use HTTPS
2. Update frontend .env:
   ```env
   VITE_API_URL=https://api.tradeflex.online/api
   ```
3. Rebuild frontend: `npm run build`
4. Check for hardcoded HTTP URLs in code
5. Add to Nginx config:
   ```nginx
   add_header Content-Security-Policy "upgrade-insecure-requests";
   ```

### SSL certificate expired
**Symptoms**: Browser shows certificate error

**Solution**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run

# Restart Nginx
sudo systemctl restart nginx
```

---

## Performance Issues

### Slow page load times
**Diagnostic Tools**:
1. Chrome DevTools → Network tab
2. PageSpeed Insights: https://pagespeed.web.dev/
3. GTmetrix: https://gtmetrix.com/

**Solutions**:
1. **Enable Gzip compression** (already in nginx.conf)
2. **Optimize images**:
   - Use WebP format
   - Compress images before upload
   - Consider Cloudinary for image CDN
3. **Enable browser caching** (already in nginx.conf)
4. **Minify assets** (Vite does this by default)
5. **Use CDN** for static assets
6. **Lazy load images** in React components

### High server memory usage
**Diagnostic**:
```bash
# Check memory usage
free -h
htop

# Check PM2 memory
pm2 monit
```

**Solutions**:
1. Restart backend: `pm2 restart estore-backend`
2. Reduce `max_memory_restart` in ecosystem.config.cjs
3. Fix memory leaks in code
4. Upgrade server RAM
5. Use cluster mode in PM2:
   ```javascript
   instances: 'max',
   exec_mode: 'cluster'
   ```

### Database queries are slow
**Solutions**:
1. Add database indexes:
   ```javascript
   productSchema.index({ name: 'text', description: 'text' });
   productSchema.index({ category: 1 });
   productSchema.index({ createdAt: -1 });
   ```
2. Use `.lean()` for read-only queries
3. Limit returned fields with `.select()`
4. Implement pagination
5. Add Redis caching for frequently accessed data

---

## Email Issues

### Emails not sending
**Symptoms**: Order confirmations don't arrive

**Diagnostic**:
```bash
# Check backend logs
pm2 logs estore-backend | grep -i email
pm2 logs estore-backend | grep -i smtp
```

**Solutions**:
1. **Gmail App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Create App Password (not regular password)
   - Use App Password in SMTP_PASS

2. **Check SMTP settings**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_app_password
   ```

3. **Test email manually**:
   ```javascript
   // Create test-email.js in backend/
   import nodemailer from 'nodemailer';
   
   const transporter = nodemailer.createTransport({
     host: 'smtp.gmail.com',
     port: 587,
     auth: {
       user: 'your_email@gmail.com',
       pass: 'your_app_password'
     }
   });
   
   transporter.sendMail({
     from: 'your_email@gmail.com',
     to: 'test@example.com',
     subject: 'Test',
     text: 'Testing email'
   }).then(() => console.log('Sent!')).catch(console.error);
   ```
   
   Run: `node test-email.js`

4. **Alternative SMTP providers**:
   - SendGrid (free tier: 100 emails/day)
   - Mailgun (free tier: 5,000 emails/month)
   - Amazon SES

### Emails go to spam
**Solutions**:
1. Set up SPF record in domains.co.za DNS
2. Set up DKIM record
3. Use a dedicated email service (SendGrid, etc.)
4. Verify sender domain
5. Avoid spam trigger words in subject/content

---

## WebSocket/Socket.IO Issues

### Real-time updates not working
**Symptoms**: Admin dashboard doesn't show live inventory updates

**Diagnostic**:
```bash
# Check browser console for WebSocket errors
# Check backend logs
pm2 logs estore-backend | grep -i socket
```

**Solutions**:
1. Verify Nginx WebSocket configuration
2. Check if Socket.IO client version matches server version
3. Test WebSocket connection:
   ```javascript
   // In browser console
   const socket = io('https://api.tradeflex.online');
   socket.on('connect', () => console.log('Connected!'));
   socket.on('connect_error', (err) => console.log('Error:', err));
   ```
4. Ensure CORS allows WebSocket connections
5. Check firewall doesn't block WebSocket

---

## Debugging Commands

### Check all services status
```bash
# Nginx
sudo systemctl status nginx

# PM2
pm2 status

# Firewall
sudo ufw status

# Ports in use
sudo netstat -tulpn | grep LISTEN
```

### View all logs
```bash
# Backend
pm2 logs estore-backend --lines 100

# Nginx access
sudo tail -f /var/log/nginx/tradeflex.access.log

# Nginx errors
sudo tail -f /var/log/nginx/tradeflex.error.log

# System logs
sudo journalctl -xe
```

### Test connectivity
```bash
# Test backend locally
curl http://localhost:5000

# Test API endpoint
curl https://api.tradeflex.online

# Test database connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"

# Test DNS
nslookup tradeflex.online
dig tradeflex.online
```

---

## Getting Help

If you're still stuck:

1. **Collect information**:
   - Error messages from logs
   - Steps to reproduce the issue
   - What you've tried already

2. **Check documentation**:
   - DEPLOYMENT_GUIDE.md
   - DEPLOYMENT_CHECKLIST.md

3. **Contact support**:
   - domains.co.za: support@domains.co.za
   - MongoDB Atlas: https://www.mongodb.com/support
   - Stack Overflow: Tag with relevant tech (node.js, nginx, mongodb)

4. **Useful logs to share**:
   ```bash
   pm2 logs estore-backend --lines 50 --nostream > backend-logs.txt
   sudo tail -100 /var/log/nginx/error.log > nginx-errors.txt
   ```

---

**Remember**: Most deployment issues are configuration-related. Double-check environment variables, connection strings, and Nginx configuration.

Good luck! 🔧
