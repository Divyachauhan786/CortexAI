FROM node:20-alpine

# pdf-parse and some LangChain deps need Python/build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Create uploads directory for temp document storage
RUN mkdir -p /app/uploads

EXPOSE 8003

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8003/ || exit 1

CMD ["node", "src/index.js"]