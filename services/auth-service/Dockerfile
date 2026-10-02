FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Credentials dir will be bind-mounted at runtime – never baked into the image
# The app reads FIREBASE_CREDENTIALS_PATH or FIREBASE_SERVICE_ACCOUNT_JSON

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:8001/ || exit 1

CMD ["node", "src/index.js"]