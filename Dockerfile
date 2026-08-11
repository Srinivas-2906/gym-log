# syntax=docker/dockerfile:1

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
WORKDIR /app
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output

EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
