# ─── Stage 1: Base image with Node + Playwright browsers ─────────────────────
FROM mcr.microsoft.com/playwright:v1.45.3-jammy AS base

WORKDIR /app

# Install Node 20 (the Playwright image ships Node 18 — upgrade for consistency)
RUN apt-get update && apt-get install -y curl \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# ─── Stage 2: Dependency install ─────────────────────────────────────────────
FROM base AS deps

COPY package*.json ./
RUN npm ci --prefer-offline

# ─── Stage 3: Final test runner image ────────────────────────────────────────
FROM base AS runner

WORKDIR /app

# Copy installed modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code (no .env — secrets are injected at runtime via env vars)
COPY . .

# Remove local .env if it was accidentally included in the build context
RUN rm -f .env

# Create directories that are gitignored but needed at runtime
RUN mkdir -p auth-state test-results allure-results playwright-report bdd-results \
    test-results/screenshots test-results/logs

# Default command: run all CRM tests
CMD ["npx", "playwright", "test", "--project=crm-chromium"]
