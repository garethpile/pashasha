FROM node:20-alpine AS build
WORKDIR /repo

# Skip lifecycle scripts (husky) during Docker install
ENV npm_config_ignore_scripts=true
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Ensure a clean npm cache to avoid ENOENT issues during CI
RUN rm -rf /root/.npm \
  && npm ci --workspaces --prefer-offline=false --no-audit --progress=false \
  && npm cache clean --force
RUN npm run build --workspace backend

FROM node:20-alpine AS runtime
WORKDIR /app

COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/backend/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/apps/backend/src/main.js"]
