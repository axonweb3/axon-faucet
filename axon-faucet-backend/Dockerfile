FROM node:16
WORKDIR /faucet
ADD ./ .
RUN yarn install

EXPOSE 3000

CMD [ "yarn", "start" ]
