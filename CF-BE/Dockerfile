FROM node:20-slim

WORKDIR /app
RUN corepack enable

COPY package.json yarn.lock ./
# Prisma does not work reliably with Yarn PnP in containers; force classic node_modules installs
RUN yarn config set nodeLinker node-modules && yarn install

COPY . .
# Generate Prisma client inside the image
ENV DATABASE_URL='file:./dev.db'
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["yarn", "start"]