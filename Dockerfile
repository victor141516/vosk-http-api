FROM python:3.10 as vosk-lib-downloader
RUN pip install vosk && cp /usr/local/lib/python3.10/site-packages/vosk/libvosk.so /libvosk.so

# TODO: this is a temporal fix because the provided lib is not updated
FROM node:18 as node-vosk-installed
WORKDIR /app
RUN npm i --no-save https://gitpkg.now.sh/alphacep/vosk-api/nodejs?master && mkdir -p /app/node_modules/vosk/lib/linux-x86_64
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so

FROM node-vosk-installed as builder
COPY package.json package-lock.json ./
RUN npm i
COPY . .
RUN npm run build

FROM node-vosk-installed as dev
COPY . .
RUN npm i
CMD ["npm", "run", "start"]

FROM node-vosk-installed
ENV NODE_PATH=/app
COPY --from=builder /app/dist ./
COPY --from=vosk-lib-downloader /libvosk.so /app/node_modules/vosk/lib/linux-x86_64/libvosk.so
COPY package.json package-lock.json ./
RUN npm i
CMD ["node", "./index.js"]