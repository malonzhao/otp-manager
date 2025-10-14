# Single build stage for unified build
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /usr/src/app
# Copy all project files
COPY . .
# Install dependencies and build both projects
RUN pnpm install
RUN cd apps/api && npx prisma generate
RUN pnpm build

# Final image with nginx and supervisor
FROM alpine:latest
RUN apk update && apk add --no-cache nodejs nginx supervisor 
# Copy built artifacts from builder stage
COPY --from=builder /usr/src/app/apps/api/dist /app
COPY --from=builder /usr/src/app/node_modules /app/node_modules
COPY --from=builder /usr/src/app/apps/api/.env.example /app/.env
COPY --from=builder /usr/src/app/apps/web/dist /usr/share/nginx/html
# Copy config files
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisord.conf"]