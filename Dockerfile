FROM node:18.15.0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18.15.0 AS runner

ENV PORT 5000

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm install --production
USER node
EXPOSE 5000
COPY --from=builder --chown=node:node /app/dist  .
CMD ["npm", "run", "start:prod"]