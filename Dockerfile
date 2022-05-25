FROM python:3.10 as vosk-lib-downloader
RUN pip install vosk && cp /usr/local/lib/python3.10/site-packages/vosk/libvosk.so /libvosk.so

# TODO: this is a temporal fix because the provided lib is not updated
FROM node:18 as binaries-installed
WORKDIR /app
RUN apt-get update \
  && apt-get install -y ffmpeg vlc \
  && npm i --no-save https://gitpkg.now.sh/alphacep/vosk-api/nodejs?master \
  && mkdir -p /app/node_modules/vosk/lib/linux-x86_64
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so

FROM binaries-installed as deps-installed
COPY package.json package-lock.json ./
RUN npm i
COPY . .

FROM deps-installed as dev
CMD ["npm", "run", "start"]

FROM deps-installed as builder
RUN npm run build

FROM builder
ENV NODE_PATH=/app
COPY --from=builder /app/dist ./
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so
COPY package.json package-lock.json ./
RUN npm i
CMD ["node", "./index.js"]