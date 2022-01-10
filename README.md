# RepMap

This is a Node.js app that...

## Dev environment

Requirements:
You need to have Node.js (https://nodejs.dev/learn/how-to-install-nodejs), Docker (https://docs.docker.com/engine/install/) and Docker Compose (https://docs.docker.com/compose/install/).

1. Configure the .env-file
   1. Copy .env.example to .env
   2. Set both the root and regular user password (MONGO_INITDB_ROOT_PASSWORD and MONGODB_PASS)
2. Run `yarn install`
3. Run `docker-compose up`
4. After Docker container is set up just exit the process. Start the docker container so that it runs in the background: `docker start repmap-mongodb-container`
5. Run `yarn dev` 

### Rebuild database
Note - you will lose all your data by doing this.
1. Remove folder "mongo-volume"
2. Run `docker start repmap-mongodb-container`
3. Run `docker rm repmap-mongodb-container`
4. Run `docker-compose up`
5. After Docker container is set up just exit the process. Start the docker container so that it runs in the background: `docker start repmap-mongodb-container`

### Run script using PM2
We want to keep the script running at all times and for this we can use PM2.

1. Run `sudo npm install pm2@latest -g`
2. Then run `pm2 start index.js`

You can run `pm2 list` to ensure that the worker is running. If you made some changes to your code you can run `pm2 restart index.js`.
