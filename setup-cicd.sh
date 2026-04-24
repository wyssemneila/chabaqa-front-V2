#!/bin/bash
# ============================================================
# Chabaqa CI/CD Setup Script
# Run this ONCE to push workflows and configure GitHub secrets
# ============================================================
set -e

echo "🔧 Chabaqa CI/CD Setup"
echo "======================"
echo ""

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
  echo "Installing GitHub CLI..."
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt update && sudo apt install gh -y
fi

# Login to GitHub
echo ""
echo "📝 Logging into GitHub..."
gh auth login

# Push workflows to both repos
echo ""
echo "📤 Pushing backend workflow..."
cd /home/ubuntu/chabaqa/backend
git push origin main

echo ""
echo "📤 Pushing frontend workflow..."
cd /home/ubuntu/chabaqa/frontend
git push origin main

# Set secrets on both repos
echo ""
echo "🔐 Setting GitHub Secrets..."

VPS_SSH_KEY=$(cat /home/ubuntu/.ssh/chabaqa_deploy)

for REPO in Louay0007/chabaqa-backend Louay0007/chabaqa-frontend; do
  echo "  Setting secrets for $REPO..."
  gh secret set VPS_HOST   --repo "$REPO" --body "51.254.132.77"
  gh secret set VPS_USER   --repo "$REPO" --body "ubuntu"
  gh secret set VPS_PORT   --repo "$REPO" --body "22"
  gh secret set VPS_SSH_KEY --repo "$REPO" --body "$VPS_SSH_KEY"
done

echo ""
echo "✅ CI/CD Setup Complete!"
echo ""
echo "Pipeline: Push to main → Lint → Build → Test → Deploy"
echo "  Backend:  https://github.com/Louay0007/chabaqa-backend/actions"
echo "  Frontend: https://github.com/Louay0007/chabaqa-frontend/actions"
