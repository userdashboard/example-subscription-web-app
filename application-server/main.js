global.keyLength = parseInt(process.env.KEY_LENGTH || '10', 10)
global.maxLength = parseInt(process.env.MAX_LENGTH || '100000', 10)
global.publicDomain = process.env.PUBLIC_DOMAIN || false

const server = require('./src/server.js')
server.start(process.env.APPLICATION_SERVER_PORT || process.env.PORT || 3000, process.env.HOST || 'localhost')
