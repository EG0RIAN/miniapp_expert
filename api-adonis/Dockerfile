FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build AdonisJS app
RUN node ace build

# Install production dependencies in build directory
RUN cd build && npm ci --omit=dev

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333

EXPOSE 3333

WORKDIR /app/build
CMD ["node", "bin/server.js"]

