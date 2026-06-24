FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Separate prod-only install so devDependencies (typescript, eslint, tailwind
# build tooling, etc.) never end up in the runtime image — they're not needed
# at runtime and are a common source of flagged vulnerabilities that don't
# actually affect a running container.
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Upgrade already-installed OS packages to their latest patched versions
# (the base image's apk index can lag behind by the time this builds), then
# install tesseract-ocr + poppler-utils, which power document OCR/text-
# extraction for the "auto-fill from document" feature (see src/lib/documents).
RUN apk update && \
    apk upgrade --no-cache && \
    apk add --no-cache tesseract-ocr tesseract-ocr-data-eng poppler-utils

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
