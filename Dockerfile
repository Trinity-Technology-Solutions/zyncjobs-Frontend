FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_AI_API_URL
ARG VITE_SOCKET_URL
ARG VITE_APP_URL
ARG VITE_ENABLE_ANALYTICS
ARG VITE_GA_TRACKING_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AI_API_URL=$VITE_AI_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_ENABLE_ANALYTICS=$VITE_ENABLE_ANALYTICS
ENV VITE_GA_TRACKING_ID=$VITE_GA_TRACKING_ID

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /var/www/zyncjobs-frontend/dist
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
