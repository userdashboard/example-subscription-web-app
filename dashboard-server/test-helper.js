/* eslint-env mocha */
global.applicationPath = __dirname

const SubscriptionTestHelper = module.exports = require('@userdashboard/stripe-subscriptions/test-helper.js')
SubscriptionTestHelper.defaultConfiguration.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
SubscriptionTestHelper.defaultConfiguration.applicationServerPort = process.env.APPLICATION_SERVER_PORT
SubscriptionTestHelper.defaultConfiguration.applicationServerToken = 'token'

const TestHelper = module.exports = require('@userdashboard/dashboard/test-helper.js')
TestHelper.defaultConfiguration.applicationServer = `http://localhost:${process.env.APPLICATION_SERVER_PORT}`
TestHelper.defaultConfiguration.applicationServerPort = process.env.APPLICATION_SERVER_PORT
TestHelper.defaultConfiguration.applicationServerToken = 'token'

const applicationServer = require('../application-server/main.js')
applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
after(applicationServer.stop)
