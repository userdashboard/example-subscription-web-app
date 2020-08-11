/* eslint-env mocha */
let applicationServer
global.applicationPath = __dirname

require('@userdashboard/stripe-subscriptions/test-helper.js')
const DashboardTestHelper = require('@userdashboard/stripe-subscriptions/test-helper.js')
const setupBeforeWas = DashboardTestHelper.setupBefore
const setupBeforeEachWas = DashboardTestHelper.setupBeforeEach
DashboardTestHelper.setupBefore = setupBefore
DashboardTestHelper.setupBeforeEach = setupBeforeEach
module.exports = DashboardTestHelper

async function setupBefore () {
  if (applicationServer) {
    return setupBeforeWas()
  }
  await setupBeforeWas()
  applicationServer = require('../application-server/main.js')
  await applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
  global.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
  global.applicationServerToken = process.env.APPLICATION_SERVER_TOKEN
}

async function setupBeforeEach () {
  await setupBeforeEachWas()
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
