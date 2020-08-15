/* eslint-env mocha */
let applicationServer
global.applicationPath = __dirname

const TestHelper = module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')
TestHelper.defaultConfiguration.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
TestHelper.defaultConfiguration.applicationServerPort = process.env.APPLICATION_SERVER_PORT
TestHelper.defaultConfiguration.applicationServerToken = 'token'

before(async () => {
  if (applicationServer) {
    return
  }
  applicationServer = require('../application-server/main.js')
  await applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
})


after(async () => {
  if (applicationServer) {
    await applicationServer.stop()
    applicationServer = null
  }
})
