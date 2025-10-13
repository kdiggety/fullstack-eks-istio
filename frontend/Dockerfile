# --- build ---
FROM node:20-alpine AS build
WORKDIR /app

# Optional: only if you truly bake an API base at build-time
# (If you use runtime-config.js, you can remove these two lines)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

# Copy the rest of the source
COPY . .

# Ensure a clean slate, then build
RUN rm -rf dist && npm run build

# Guardrail: FAIL if GIS appears in the built output
RUN ! grep -RniE 'accounts\.google\.com/gsi|google\.accounts\.id|g_id_onload' dist || \
    (echo 'ERROR: GIS detected in build output. Remove the GIS script and rebuild.' && exit 1)

# --- serve static ---
FROM nginx:1.27-alpine
# Your nginx.conf should handle caching assets but not runtime-config.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built site
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
