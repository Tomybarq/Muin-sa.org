# --- Stage 1: Build Environment ---
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# --- Stage 2: Runtime Environment ---
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

USER node

COPY --chown=node:node --from=builder /usr/src/app/public ./public
COPY --chown=node:node --from=builder /usr/src/app/.next/standalone ./
COPY --chown=node:node --from=builder /usr/src/app/.next/static ./.next/static

COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 8080

CMD ["node", "server.js"]
