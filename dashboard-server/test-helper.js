/* eslint-env mocha */
let applicationServer

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')

before(async () => {
  console.log('test-helper-before....')
  if (applicationServer) {
    return
  }
  applicationServer = require('../application-server/main.js')
  console.log('starting from before', process.env.APPLICATION_SERVER_PORT)
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
