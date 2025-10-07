# Stage 1: Build Angular App
# Use lightweight Node image (alpine) for fast builds
FROM node:22-alpine as build

# Set working directory inside the container
WORKDIR /app

# Copy only package files first for Docker cache optimization
# This ensures npm install is only re-run if dependencies change
COPY package*.json ./

# Install project dependencies cleanly
RUN npm ci

# Copy the rest of the project files
COPY . .

# Build Angular app in production mode
# This creates optimized build files in dist folder
RUN npm run build --configuration=production

# Use lightweight nginx alpine image
FROM nginx:alpine

# Copy custom nginx config (if you have routing rules for SPA)
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app from previous stage
# This is the production-ready optimized build
COPY --from=build /app/dist/POC/browser /usr/share/nginx/html

# Expose port 80 for web access
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
