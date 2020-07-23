global.keyLength = parseInt(process.env.KEY_LENGTH || '10', 10)
global.maxLength = parseInt(process.env.MAX_LENGTH || '9999999', 10)
global.publicDomain = process.env.PUBLIC_DOMAIN || false
global.dashboardServer = global.dashboardServer || process.env.DASHBOARD_SERVER
global.applicationServer = global.applicationServer || process.env.APPLICATION_SERVER
global.applicationServerToken = global.applicationServerToken || process.env.APPLICATION_SERVER_TOKEN

let server
module.exports = {
  start: async (port, dashboardServer) => {
    server = require('./src/server.js')
    port = port || process.env.APPLICATION_SERVER_PORT || process.env.PORT || 3000
    global.dashboardServer = dashboardServer || global.dashboardServer
    await server.start(port, process.env.HOST || 'localhost')
  },
  stop: async () => {
    server.stop()
  }
}

if (process.env.START_APPLICATION_SERVER !== 'false') {
  module.exports.start()
}
