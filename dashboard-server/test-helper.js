/* eslint-env mocha */
let applicationServer
global.applicationPath = __dirname

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')

before(async () => {
  if (applicationServer) {
    return
  }
  applicationServer = require('../application-server/main.js')
  await applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
  global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
})

beforeEach(async () => {
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
  global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
})

after(async () => {
  if (applicationServer) {
    await applicationServer.stop()
    applicationServer = null
  }
})
