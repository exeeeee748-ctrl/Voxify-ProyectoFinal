# Etapa 1: compilación del frontend React + Vite
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://localhost:5173
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servidor web Nginx
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
