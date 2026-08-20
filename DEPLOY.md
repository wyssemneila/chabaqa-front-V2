# Chabaqa Frontend Deployment Guide

Follow these steps to deploy the Chabaqa frontend on your VPS.

## Prerequisites
- A VPS with Docker and Docker Compose installed.
- The `chabaqa-frontend` folder uploaded to your VPS.
- Your backend API running and accessible (e.g., at `http://51.254.132.77:3000/api`).

## Step-by-Step Deployment

### 1. Connect to your VPS
SSH into your server:
```bash
ssh user@51.254.132.77
```

### 2. Navigate to the project folder
Go to where you uploaded the files:
```bash
cd /path/to/chabaqa-frontend
```

### 3. Verify Configuration
Ensure `docker-compose.prod.yml` has the correct IP:
```bash
cat docker-compose.prod.yml
# Check that NEXT_PUBLIC_API_URL points to http://51.254.132.77:3000/api
```

### 4. Make the deployment script executable
Grant execution permissions to the script:
```bash
chmod +x deploy.sh
```

### 5. Run the deployment
Execute the automated deployment script. This will build the image and start the container.
```bash
./deploy.sh
```

### 6. Verify it's running
Check if the container is up:
```bash
docker ps
```
You should see `chabaqa-frontend` running on port `8080`.

### 7. (Optional) Configure Nginx
If you want to serve the app on port 80 (standard HTTP) instead of 8080:

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```
2. Copy the config:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/chabaqa
   ```
3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/chabaqa /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default if needed
   ```
4. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## Troubleshooting
- **Logs:** To see application logs: `docker logs -f chabaqa-frontend`
- **Rebuild:** If you change an environment variable, run `./deploy.sh` again to rebuild.
