FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build AdonisJS app
RUN node ace build

# Switch to build directory
WORKDIR /app/build

# Install production dependencies
RUN npm ci --production

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

EXPOSE 3333

CMD ["node", "bin/server.js"]

