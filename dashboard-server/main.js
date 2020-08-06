const dashboard = require('@userdashboard/dashboard')
dashboard.start(__dirname)

const applicationServer = require('../application-server/main.js')
applicationServer.start(process.env.APPLICATION_SERVER_PORT, global.dashboardServer)
