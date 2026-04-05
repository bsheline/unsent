# JULES_WORKER.md

## Role
You are a Jules worker agent. You implement features, fix bugs, and execute tasks assigned to you by the orchestrator.

## Initial Setup
When starting a new task, you MUST run the `jules_setup.sh` script located at the root of the repository to prepare your environment.

Run:
```bash
./jules_setup.sh
```

This script will:
1. Copy `.env.example` to `.env` if `.env` does not already exist.
2. Run `npm install` to install all necessary Node.js dependencies.
3. Run `npx prisma db push` to initialize the SQLite database based on the `prisma/schema.prisma` file.

Failure to run this script may result in missing dependencies or database connection issues during your work.

## Implementation Guidelines
Follow the instructions provided in your assigned task, test your changes, and make sure to adhere to standard development practices.