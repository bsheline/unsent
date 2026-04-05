#!/usr/bin/env bash
set -e

echo "Setting up the environment for Jules..."

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

echo "Setup complete!"
