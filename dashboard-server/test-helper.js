/* eslint-env mocha */
let applicationServer
global.applicationPath = __dirname

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')

async function setupBefore () {
  if (applicationServer) {
    return
  }
  applicationServer = require('../application-server/main.js')
  await applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
  global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
}

async function setupBeforeEach () {
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
  global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
}

before(setupBefore)
beforeEach(setupBeforeEach)

after(async () => {
  if (applicationServer) {
    await applicationServer.stop()
    applicationServer = null
  }
})
