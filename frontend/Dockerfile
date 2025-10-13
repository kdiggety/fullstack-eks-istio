FROM node:20-alpine AS build
WORKDIR /app

# Cache-buster coming from CI (commit SHA)
ARG BUILD_REF=dev

# Make the cache-bust materially affect the layer cache:
# Writing a file guarantees a new layer when BUILD_REF changes
RUN echo "$BUILD_REF" > /app/.build-ref

COPY package*.json ./
RUN npm ci

# Copy sources after deps to leverage dependency caching normally
COPY . .

# Ensure a clean build every time
RUN rm -rf dist && npm run build

# Guardrail: fail if any GIS remnants slipped into the output
RUN ! grep -RniE 'accounts\.google\.com/gsi|google\.accounts\.id|g_id_onload' dist \
  || (echo 'ERROR: GIS detected in build output. Remove the GIS script and rebuild.' && exit 1)

# --- serve static ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

