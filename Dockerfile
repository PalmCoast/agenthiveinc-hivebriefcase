# ClaudeFarm storefront — runs anywhere Node runs (Render, Railway, Fly, a VM…)
FROM node:20-bookworm-slim

WORKDIR /app

# Install production dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source.
COPY . .

# Build + verify products at image build time so the container never serves
# an unbuilt or stale artifact.
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# APP_SECRET, STRIPE_SECRET_KEY, etc. are provided at runtime via env.
CMD ["node", "server/index.js"]
