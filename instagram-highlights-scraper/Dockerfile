# Imagen base oficial de Apify con Node.js 20
FROM apify/actor-node:20

# Copiar archivos de dependencias primero (mejor cache de Docker)
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código
COPY . ./

# Comando de inicio
CMD ["node", "src/main.js"]
