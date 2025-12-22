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

RUN apk add --no-cache postgresql-client

# Copy only what we need
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY package*.json ./

EXPOSE 3000

CMD ["sh", "-c", "until pg_isready -h $DB_HOST -p 5432; do echo 'Waiting for DB...'; sleep 2; done; npx prisma migrate deploy && npm run start:prod"]