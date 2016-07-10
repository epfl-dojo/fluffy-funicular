# docker build -t epfldojo/fluffy-funicular .
# docker run -it --rm --name fluffy-funicular -v `pwd`/data:/app/data epfldojo/fluffy-funicular

# https://github.com/nodejs/docker-node
FROM node:6.3.0
MAINTAINER Nicolas Borboën <nicolas.borboen@epfl.ch>

WORKDIR /app

# Bundle app source
COPY ./index.js /app/index.js
ADD package.json /app/
RUN npm install

CMD ["node", "index.js"]
