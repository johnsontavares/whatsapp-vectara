#testando app 

FROM node:14
RUN mkdir -p /opt/app

WORKDIR /opt/app
COPY . .
RUN npm install
EXPOSE 8080
CMD [ "npm", "start"]