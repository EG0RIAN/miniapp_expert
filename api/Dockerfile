FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production --no-audit --no-fund

# Copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]


