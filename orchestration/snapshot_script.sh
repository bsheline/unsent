#!/usr/bin/env bash
set -e

echo "Setting up the environment for Jules Worker..."

if [ ! -f .env ]; then
  echo "Copying .env.example to .env..."
  cp .env.example .env
else
  echo ".env already exists."
fi

echo "Installing npm dependencies..."
npm install

echo "Pushing Prisma schema to SQLite database..."
npx prisma db push

echo "Installing GitHub CLI..."
sudo apt update && sudo apt install -y curl
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

echo "Installing Jules CLI..."
npm install -g --force @google/jules

echo "Setup complete!"
