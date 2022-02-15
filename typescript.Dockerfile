FROM node:latest
WORKDIR /app
COPY typescript/package.json .
COPY typescript/tsconfig.json .
RUN yarn install
COPY typescript/src .
RUN ./node_modules/.bin/tsc
ENTRYPOINT ["node"]
CMD ["dist/index.js"]
