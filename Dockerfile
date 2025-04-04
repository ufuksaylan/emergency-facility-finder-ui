# Stage 1: Build the application
# Match local Node major version (v22) for consistency
FROM node:22-alpine AS builder

WORKDIR /app

# --- Build-time Arguments ---
# Define the API base URL needed by Vite during the build
ARG VITE_API_BASE_URL="http://localhost:3000/api" # Default if not provided during build

# --- Dependency Installation ---
# Copy only package files first to leverage Docker cache
COPY package.json package-lock.json ./
# Use npm ci for clean, reproducible installs based on package-lock.json
RUN npm ci

# --- Copy Source Code ---
# Copy the rest of the application code
COPY . .

# --- Set Environment Variables for Build ---
# Make the build argument available as an environment variable for the 'npm run build' command
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# --- Build Application ---
# Vite will use the VITE_API_BASE_URL environment variable during the build
RUN npm run build
# The build output will be in /app/dist

# Stage 2: Serve the application using a Node.js server
# Use the same Node version for consistency and smaller image size potential
FROM node:22-alpine

WORKDIR /app

# --- Install Production Server ---
# Install 'serve', a popular static file serving package
# Use --no-cache to reduce image size slightly if using apk add first (not strictly needed here)
# Or install globally directly with npm:
RUN npm install -g serve

# --- Copy Built Assets ---
# Copy only the built application artifacts from the 'builder' stage
COPY --from=builder /app/dist /app/dist

# --- Expose Port ---
# Expose the port the server will run on (default for 'serve' is 3000, but let's use 8080 for clarity)
# You can change this port if needed.
EXPOSE 8080

# --- Run Command ---
# Start the 'serve' command to serve the static files from the /app/dist directory
# The '-s' flag is important for Single Page Applications (SPAs) like Vue
# It rewrites all requests to index.html so client-side routing works correctly.
# The '-l' flag specifies the port to listen on.
CMD ["serve", "-s", "-l", "8080", "/app/dist"]
