# Frontend Dockerfile for HopOn (Next.js)
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps and build
COPY package.json package-lock.json* ./
COPY . .
RUN npm ci && npm run build

# Runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app .

EXPOSE 3000
CMD ["npm", "run", "start"]
