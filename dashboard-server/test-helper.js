/* eslint-env mocha */
global.applicationPath = __dirname
global.testConfiguration = {
  applicationServer: `http://localhost:${process.env.APPLICATION_SERVER_PORT}`,
  applicationServerPort: process.env.APPLICATION_SERVER_PORT,
  applicationServerToken: 'token'
}

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')


const applicationServer = require('../application-server/main.js')
applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
after(applicationServer.stop)
