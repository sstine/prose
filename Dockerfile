FROM node:4
MAINTAINER Jun Matsushita <jun@iilab.org>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

RUN mkdir -p dist && node_modules/.bin/gulp production

EXPOSE 3000
CMD [ "node_modules/.bin/serve", "-D", "--compress", "-f", "img/favicon.ico" ]
