#testando app 

FROM chrishubert/whatsapp-web-api:latest
WORKDIR .
COPY . .
RUN npm install
EXPOSE 8080
CMD [ "npm", "start"]