#!/bin/bash
set -e

PROJECT_DIR="/home/ubuntu/chabaqa"
cd "$PROJECT_DIR"

echo "🚀 Deploying Chabaqa..."

# Pull latest code
echo "📦 Pulling latest code..."
(cd frontend && git pull)
(cd backend && git pull)

# Rebuild and restart containers
echo "🔨 Building Docker images..."
sudo docker compose build --no-cache

echo "♻️  Restarting containers..."
sudo docker compose up -d --force-recreate

# Wait for health
echo "⏳ Waiting for services to be healthy..."
sleep 10
sudo docker compose ps

# Test endpoints
echo "🧪 Testing endpoints..."
BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api)
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/)

if [ "$BACKEND" = "200" ]; then
  echo "  ✅ Backend: OK ($BACKEND)"
else
  echo "  ❌ Backend: FAILED ($BACKEND)"
  sudo docker logs chabaqa-backend --tail 20
fi

if [ "$FRONTEND" = "200" ] || [ "$FRONTEND" = "307" ]; then
  echo "  ✅ Frontend: OK ($FRONTEND)"
else
  echo "  ❌ Frontend: FAILED ($FRONTEND)"
  sudo docker logs chabaqa-frontend --tail 20
fi

echo ""
echo "🎉 Deployment complete!"
echo "   🌐 https://chabaqa.io"
echo "   📡 API: https://chabaqa.io/api"
