FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

ENV NODE_ENV=development

# Install nodemon globally for hot-reloading
RUN npm install -g nodemon

CMD ["nodemon", "src/app.js"]
