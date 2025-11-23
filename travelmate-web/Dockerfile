FROM node:20-alpine AS build
WORKDIR /app

ARG REACT_APP_API_URL=https://various-belva-untab-1a59bee2.koyeb.app/api
ARG REACT_APP_WS_URL=wss://various-belva-untab-1a59bee2.koyeb.app/ws
ARG REACT_APP_GOOGLE_CLIENT_ID=""
ARG REACT_APP_KAKAO_APP_KEY=""
ARG REACT_APP_NAVER_CLIENT_ID=""
ARG REACT_APP_KAKAO_MAP_API_KEY=""

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_WS_URL=$REACT_APP_WS_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_KAKAO_APP_KEY=$REACT_APP_KAKAO_APP_KEY
ENV REACT_APP_NAVER_CLIENT_ID=$REACT_APP_NAVER_CLIENT_ID
ENV REACT_APP_KAKAO_MAP_API_KEY=$REACT_APP_KAKAO_MAP_API_KEY

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY craco.config.js ./

COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html

RUN rm -rf ./*

COPY --from=build /app/build .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
