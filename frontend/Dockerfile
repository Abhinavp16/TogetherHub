FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite bakes these into the bundle at build time; they must be URLs the browser can reach.
ARG VITE_SERVER_URL=http://localhost:5000
ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_COLLAB_URL=ws://localhost:1234
ENV VITE_SERVER_URL=$VITE_SERVER_URL \
    VITE_API_URL=$VITE_API_URL \
    VITE_COLLAB_URL=$VITE_COLLAB_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
