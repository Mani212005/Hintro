FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.json jest.config.cjs ./
COPY prisma ./prisma
COPY src ./src

RUN npm install -g pnpm && pnpm install --prod=false
RUN pnpm prisma generate
RUN pnpm build

EXPOSE 5000
CMD ["node", "dist/src/server.js"]
