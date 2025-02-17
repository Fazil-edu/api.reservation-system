FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/
COPY .env ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
