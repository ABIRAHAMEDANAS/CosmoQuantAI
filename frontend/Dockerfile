# Node Image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (caching layer)
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Expose Vite port
EXPOSE 3000

# Run dev server with host exposed
CMD ["npm", "run", "dev", "--", "--host"]