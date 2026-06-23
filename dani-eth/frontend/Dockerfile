FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json primero para aprovechar cache
COPY package*.json ./

RUN npm install

# Copiar el resto del código
COPY . .

EXPOSE 5173

# En desarrollo, levantar Vite con hot-reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
