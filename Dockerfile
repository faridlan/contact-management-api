# ---------- Builder stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Dummy DB url ONLY for prisma generate
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/dummy"

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client (types only)
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine

WORKDIR /app

# Copy only what we need
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]