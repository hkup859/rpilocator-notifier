FROM node:16-alpine3.15 as base

RUN apk add --no-cache \
    chromium \
  && rm -rf /var/cache/apk/* /tmp/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /home/node/app

COPY package*.json ./

RUN npm i

COPY . .

FROM base as production

RUN node src/cron.js