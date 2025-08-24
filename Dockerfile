# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY server/ ./
COPY client/ ./client/

# Build client
RUN cd client && npm run build

# Copy built client to server public directory
RUN mkdir -p public && cp -r client/dist/* public/

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Start the application
CMD ["node", "index.production.js"]
