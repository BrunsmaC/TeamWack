FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

<<<<<<< HEAD
COPY index.js ./
COPY data ./data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["npm", "start"]
=======
COPY index.js ./index.js

EXPOSE 3001

CMD ["npm", "start"]
>>>>>>> origin/sprint4
