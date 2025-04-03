# Stage 1: Build the application
# Match local Node major version (v22) for consistency
FROM node:22-alpine AS builder

WORKDIR /app

# --- Build-time Arguments ---
# Define the API base URL needed by Vite during the build
ARG VITE_API_BASE_URL="http://localhost:3000/api" # Default if not provided during build

# --- Dependency Installation ---
COPY package.json package-lock.json ./
RUN npm ci

# --- Copy Source Code ---
COPY . .

# --- Set Environment Variables for Build ---
# Make the build argument available for the 'npm run build' command
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# --- Build Application ---
# Vite will use the VITE_API_BASE_URL environment variable
RUN npm run build
# Output should be in /app/dist

# Stage 2: Serve the application using Nginx
# Use a stable alpine Nginx image
FROM nginx:stable-alpine
# Or use the specific version if preferred: FROM nginx:1.25.3-alpine3.18

# --- Nginx Configuration ---
# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom static Nginx configuration file
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf

# --- Copy Built Assets ---
# Copy the built Vue app from the 'builder' stage
COPY --from=builder /app/dist /usr/share/nginx/html

# --- Expose Port ---
EXPOSE 80

# --- Run Command ---
# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
