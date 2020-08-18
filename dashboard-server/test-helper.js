/* eslint-env mocha */
global.applicationPath = __dirname

module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')
require('@userdashboard/dashboard/test-helper.js')
global.defaultConfiguration.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
global.defaultConfiguration.applicationServerPort = process.env.APPLICATION_SERVER_PORT
global.defaultConfiguration.applicationServerToken = 'token'


const applicationServer = require('../application-server/main.js')
applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
after(applicationServer.stop)
