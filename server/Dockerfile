FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6aab62974f8a2ae12db30a0ca55d0a67e2943468
COPY index.js ./
COPY data ./data

ENV NODE_ENV=production
ENV PORT=3001
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["npm", "start"]
<<<<<<< HEAD
=======
=======
>>>>>>> 6aab62974f8a2ae12db30a0ca55d0a67e2943468
COPY index.js ./index.js

EXPOSE 3001

CMD ["npm", "start"]
<<<<<<< HEAD
>>>>>>> origin/sprint4
=======
>>>>>>> 6aab62974f8a2ae12db30a0ca55d0a67e2943468
