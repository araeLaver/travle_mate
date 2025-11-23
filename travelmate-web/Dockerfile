# Multi-stage build for optimized image size

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for environment variables with defaults
ARG REACT_APP_API_URL=https://various-belva-untab-1a59bee2.koyeb.app/api
ARG REACT_APP_WS_URL=wss://various-belva-untab-1a59bee2.koyeb.app/ws
ARG REACT_APP_GOOGLE_CLIENT_ID=""
ARG REACT_APP_KAKAO_APP_KEY=""
ARG REACT_APP_NAVER_CLIENT_ID=""
ARG REACT_APP_KAKAO_MAP_API_KEY=""

# Set environment variables for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_KAKAO_APP_KEY=$REACT_APP_KAKAO_APP_KEY
ENV REACT_APP_NAVER_CLIENT_ID=$REACT_APP_NAVER_CLIENT_ID
ENV REACT_APP_KAKAO_MAP_API_KEY=$REACT_APP_KAKAO_MAP_API_KEY

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy configuration files
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY craco.config.js ./

# Copy source code
COPY src ./src
COPY public ./public

# Build application with environment variables
RUN echo "Building TravelMate frontend..." && npm run build

# Stage 2: Runtime with Nginx
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built app from build stage
COPY --from=build /app/build .

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
