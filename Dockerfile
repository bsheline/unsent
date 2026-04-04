FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV DATABASE_URL=file:/data/prod.db
CMD ["npm", "start"]
