#!/usr/bin/env bash
set -e

echo "Setting up the environment for Jules Worker..."

# 1. Environment Setup
if [ ! -f .env ]; then
  cp .env.example .env
fi

# 2. Dependencies (ci is correct here)
npm ci

# 3. Database Sync
# This often creates a .db file or modifies files in the internal prisma folder
npx prisma db push

# 4. Tooling
sudo apt update && sudo apt install -y curl
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# 5. Global CLI
npm ci -g @google/jules

# 6. CRITICAL: Reset the working tree
# This discards the changes to package-lock.json or the SQLite DB 
# while keeping the installed binaries/packages in the environment.
git reset --hard HEAD
git clean -fd

echo "Setup complete!"
