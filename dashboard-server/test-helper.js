/* eslint-env mocha */
global.applicationPath = __dirname
global.testConfiguration = global.testConfiguration || {}
global.testConfiguration.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
global.testConfiguration.applicationServerPort = process.env.APPLICATION_SERVER_PORT
global.testConfiguration.applicationServerToken = 'token'

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')


const applicationServer = require('../application-server/main.js')
applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
after(applicationServer.stop)
