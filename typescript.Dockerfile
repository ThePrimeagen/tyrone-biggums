FROM node:latest
WORKDIR /app
COPY package.json .
RUN yarn install
COPY typescript/src .

