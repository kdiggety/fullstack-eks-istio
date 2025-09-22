# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# Accept backend base URL as a build argument
ARG VITE_API_BASE_URL
# Expose it as an environment variable for Vite
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci
COPY . .

# Vite will read any env var prefixed with VITE_
RUN npm run build

# --- serve static ---
FROM nginx:1.27-alpine
# Copy your custom Nginx server config (overwrites the image default)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy the built assets
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
