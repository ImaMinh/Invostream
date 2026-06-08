FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose Vite's default dev port
EXPOSE 5173

# Run Vite in development mode, listening on all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
