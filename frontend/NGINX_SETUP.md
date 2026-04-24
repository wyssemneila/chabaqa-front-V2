# Nginx Setup Guide for chabaqa.io

## Prerequisites
- DNS records pointing to your VPS (51.254.132.77) - ✅ Already configured
- Frontend running on port 8080 via Docker
- SSH access to your VPS

## Step 1: Install Nginx on VPS

```bash
# SSH into your VPS
ssh root@51.254.132.77

# Update package list
apt update

# Install nginx
apt install nginx -y

# Check nginx status
systemctl status nginx
```

## Step 2: Copy Nginx Configuration

```bash
# On your VPS, create the nginx config
nano /etc/nginx/sites-available/chabaqa.io
```

Copy the content from `nginx.conf` in this directory, or run:

```bash
# From your local machine, copy the config to VPS
scp nginx.conf root@51.254.132.77:/etc/nginx/sites-available/chabaqa.io
```

## Step 3: Enable the Site

```bash
# Create symbolic link to enable the site
ln -s /etc/nginx/sites-available/chabaqa.io /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

## Step 4: Verify Frontend is Running

```bash
# Check if Docker container is running
docker ps | grep chabaqa-frontend

# If not running, start it
cd /path/to/chabaqa-frontend
docker-compose -f docker-compose.prod.yml up -d

# Check if port 8080 is listening
netstat -tlnp | grep 8080
# or
ss -tlnp | grep 8080
```

## Step 5: Test the Setup

```bash
# Test locally on VPS
curl http://localhost:8080

# Test from outside
curl http://chabaqa.io
```

## Step 6: Setup SSL with Let's Encrypt (Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d chabaqa.io -d www.chabaqa.io

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Certbot will automatically update your nginx config
```

After SSL setup, uncomment the HTTPS section in `nginx.conf` if needed.

## Step 7: Auto-renewal Setup

```bash
# Test auto-renewal
certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
# Check it with:
systemctl list-timers | grep certbot
```

## Troubleshooting

### Frontend not accessible
```bash
# Check nginx error logs
tail -f /var/log/nginx/error.log

# Check if frontend is running
docker logs chabaqa-frontend

# Check if port 8080 is open
curl http://localhost:8080
```

### DNS not resolving
```bash
# Check DNS propagation
nslookup chabaqa.io
dig chabaqa.io

# Wait up to 24 hours for full propagation
```

### Nginx errors
```bash
# Check nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx

# Check nginx status
systemctl status nginx
```

## Firewall Configuration

```bash
# Allow HTTP and HTTPS through firewall
ufw allow 'Nginx Full'

# Or manually:
ufw allow 80/tcp
ufw allow 443/tcp

# Check firewall status
ufw status
```

## Current Configuration Summary

- Domain: chabaqa.io, www.chabaqa.io
- VPS IP: 51.254.132.77
- Frontend Port: 8080 (Docker)
- Nginx Port: 80 (HTTP), 443 (HTTPS after SSL)
- Proxy: Nginx → localhost:8080

## Next Steps

1. SSH into your VPS
2. Install nginx (if not already installed)
3. Copy the nginx.conf to `/etc/nginx/sites-available/chabaqa.io`
4. Enable the site and reload nginx
5. Setup SSL with certbot
6. Test your domain: http://chabaqa.io
