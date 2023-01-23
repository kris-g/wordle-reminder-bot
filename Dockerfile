FROM node:19-alpine

# create dir
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# copy in source code
COPY --chown=node:node ./ ./

# start server
CMD [ "npm", "start" ]
