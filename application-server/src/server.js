const applicationServer = require('@userdashboard/express-application-server')
const Busboy = require('busboy')
const connect = require('connect')
const dashboardServer = require('./dashboard-server.js')
const Document = require('./document.js')
const fs = require('fs')
const http = require('http')
const path = require('path')
const querystring = require('querystring')
const rateLimit = require('connect-ratelimit')
const route = require('connect-route')

const mimeTypes = {
  js: 'text/javascript',
  css: 'text/css',
  txt: 'text/plain',
  html: 'text/html',
  jpg: 'image/jpeg',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml'
}

let server
module.exports = {
  start: (port, host) => {
    server = http.createServer(app).listen(port, host)
  },
  stop: () => {
    if (server) {
      server.close()
      server = null
    }
  }
}

const app = connect()
if (global.rateLimit) {
  app.use(rateLimit(global.rateLimit))
}
app.use(applicationServer)
app.use(parsePostData)
app.use(route(async (router) => {
  const homePage = fs.readFileSync(path.join(__dirname, '/www/home.html')).toString()
  const indexPage = fs.readFileSync(path.join(__dirname, '/www/index.html')).toString()
  const cache = {}
  // home page and static files
  app.use(async (req, res, next) => {
    res.statusCode = 200
    const urlPath = req.url.split('?')[0]
    if (urlPath === '/' || urlPath === '/index') {
      res.setHeader('content-type', 'text/html')
      res.end(indexPage)
      return next()
    }
    if (urlPath === '/home') {
      const subscription = await verifySubscription(req)
      if (!subscription) {
        return req.verified ? subscriptionError(res) : dashboardError(res)
      }
      res.setHeader('content-type', 'text/html')
      if (global.publicDomain) {
        res.end(homePage.replace('</html>', `<script>
  window.publicDomain = "${global.publicDomain}" 
</script></html>`))
      } else {
        res.end(homePage)
      }
      return next()
    }
    if (req.url === '/whois.js') {
      const whois = {
        accountid: req.accountid,
        sessionid: req.sessionid
      }
      const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
      if (organizations && organizations.length) {
        whois.organizations = organizations
      }
      res.setHeader('content-type', 'text/javascript')
      return res.end('window.user = ' + JSON.stringify(whois))
    }
    if (!req.url.startsWith('/public/')) {
      return next()
    }
    const filePath = path.join(__dirname, '/www' + req.url.split('?')[0])
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404
      res.end()
      return next()
    }
    const extension = filePath.split('.').pop().toLowerCase()
    const contentType = mimeTypes[extension]
    if (!contentType) {
      res.statusCode = 404
      res.end()
      return next()
    }
    const blob = cache[filePath] = cache[filePath] || fs.readFileSync(filePath)
    res.setHeader('content-type', contentType)
    res.setHeader('content-length', blob.length)
    res.end(blob)
    return next()
  })
  // raw posts
  router.get('/document/:id/raw', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    const key = req.params.id
    let document
    try {
      document = await Document.load(key, req)
    } catch (error) {
    }
    if (!document) {
      res.writeHead(404, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    if (req.accountid !== document.accountid) {
      const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
      let found = false
      if (organizations && organizations.length) {
        for (const organization of organizations) {
          found = organization.organizationid === document.organizationid
          if (found) {
            break
          }
        }
      }
      if (!found) {
        res.writeHead(500, { 'content-type': 'application/json' })
        return res.end('{ "message": "An invalid document was provided" }')
      }
    }
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end(document.buffer.toString())
  })
  // public posts
  const publicPage = fs.readFileSync(path.join(__dirname, '/public.html')).toString()
  router.get('/document/public/:id', async (req, res) => {
    const key = req.params.id
    let result
    try {
      result = await Document.load(key, req)
    } catch (error) {
    }
    if (!result) {
      res.writeHead(404, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    if (!result.public || req.headers.host !== global.publicDomain) {
      res.writeHead(500, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    res.writeHead(200, { 'content-type': 'text/html' })
    result.document = result.document.toString()
    const tagged = publicPage.replace('<li>View public post</li>', '<li>View public post ' + key + '</li>')
    return res.end(`${tagged}
<script>window.post = ${JSON.stringify(result)}</script>`)
  })
  // raw public posts
  router.get('/document/public/:id/raw', async (req, res) => {
    const key = req.params.id
    let document
    try {
      document = await Document.load(key, req)
    } catch (error) {
    }
    if (!document) {
      res.writeHead(404, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    if (!document.public || req.headers.host !== global.publicDomain) {
      res.writeHead(500, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end(document.buffer.toString())
  })
  // list of posts
  router.get('/documents', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    let list
    try {
      list = await Document.list(`account/${req.accountid}`, req)
    } catch (error) {
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    if (!list || !list.length) {
      return res.end('[]')
    }
    return res.end(JSON.stringify(list))
  })
  // list of organization's posts
  router.get('/documents/organization/:id', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
    let found = false
    if (organizations && organizations.length) {
      for (const organization of organizations) {
        found = organization.organizationid === req.params.id
        if (found) {
          break
        }
      }
    }
    if (!found) {
      res.writeHead(500, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    let list
    try {
      list = await Document.list(`organization/${req.params.id}`, req)
    } catch (error) {
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    if (!list || !list.length) {
      return res.end('[]')
    }
    return res.end(JSON.stringify(list))
  })
  // delete posts
  router.delete('/document/:id', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    const key = req.params.id
    let deleted
    try {
      deleted = await Document.remove(key, req)
    } catch (error) {
    }
    if (!deleted) {
      res.writeHead(500, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end()
  })
  // create posts
  router.post('/document', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    let document
    try {
      document = await Document.create(req)
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' })
      return res.end(`{ "message": "${error.message}" }`)
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify(document))
  })
  // load posts
  router.get('/document/:id', async (req, res) => {
    const subscription = await verifySubscription(req)
    if (!subscription) {
      return req.verified ? subscriptionError(res) : dashboardError(res)
    }
    const key = req.params.id
    let result
    try {
      result = await Document.load(key, req)
    } catch (error) {
    }
    if (!result) {
      res.statusCode = 404
      res.writeHead(404, { 'content-type': 'application/json' })
      return res.end('{ "message": "An invalid document was provided" }')
    }
    if (req.accountid !== result.accountid) {
      const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.accountid}`, req.accountid, req.sessionid)
      let found = false
      if (organizations && organizations.length) {
        for (const organization of organizations) {
          found = organization.organizationid === result.organizationid
          if (found) {
            break
          }
        }
      }
      if (!found) {
        res.writeHead(500, { 'content-type': 'application/json' })
        return res.end('{ "message": "An invalid document was provided" }')
      }
    }
    res.writeHead(200, { 'content-type': 'application/json' })
    result.document = result.document.toString()
    return res.end(JSON.stringify(result))
  })
  // require and create subscription
  router.get('/setup-subscription', async (req, res) => {
    if (!req.verified || !req.accountid) {
      return dashboardError(res)
    }
    const subscriptions = await dashboardServer.get(`/api/user/subscriptions/subscriptions?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
    if (subscriptions && subscriptions.length) {
      res.writeHead(302, { location: '/home' })
      return res.end()
    }
    const billingProfiles = await dashboardServer.get(`/api/user/subscriptions/customers?accountid=${req.accountid}&limit=1`, req.accountid, req.sessionid)
    if (!billingProfiles || !billingProfiles.length) {
      res.writeHead(302, { location: '/account/subscriptions/create-billing-profile?returnURL=/setup-subscription' })
      return res.end()
    }
    try {
      const subscriptionData = {
        planid: 'gold',
        quantity: 1
      }
      const subscription = await dashboardServer.post(`/api/user/subscriptions/create-subscription?customerid=${billingProfiles[0].id}`, subscriptionData, req.accountid, req.sessionid)
      if (subscription && subscription.id) {
        res.writeHead(302, { location: '/home' })
        return res.end()
      }
    } catch (error) {
    }
    res.writeHead(302, { location: '/account/subscriptions/create-billing-profile?returnURL=/setup-subscription' })
    return res.end()
  })
}))

async function verifySubscription (req) {
  if (!req.accountid) {
    return false
  }
  const account = await dashboardServer.get(`/api/user/account?accountid=${req.accountid}`, req.accountid, req.sessionid)
  if (account.administrator) {
    return true
  }
  const subscriptions = await dashboardServer.get(`/api/user/subscriptions/subscriptions?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
  if (!subscriptions || !subscriptions.length) {
    return false
  }
  for (const subscription of subscriptions) {
    if (subscription.current_period_end) {
      return true
    }
  }
  return false
}

const errorPage = fs.readFileSync(path.join(__dirname, '/error.html')).toString()
function dashboardError (res) {
  res.setHeader('content-type', 'text/html')
  res.statusCode = 511
  res.end(errorPage)
}

function subscriptionError (res) {
  res.statusCode = 302
  res.setHeader('location', '/account/subscriptions/start-subscription')
  res.end()
}

function parsePostData (req, res, next) {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'HEAD') {
    return next()
  }
  const ct = req.headers['content-type']
  if (ct && ct.startsWith('multipart/form-data')) {
    if (!req.headers['content-length']) {
      return next()
    }
    req.body = {}
    const busboy = new Busboy({ headers: req.headers })
    busboy.on('field', (fieldname, val) => {
      req.body[fieldname] = val
    })
    busboy.on('finish', next)
    return req.pipe(busboy)
  }
  let body
  req.on('data', (chunk) => {
    body = body ? body + chunk : chunk
  })
  req.on('end', () => {
    if (body) {
      req.body = querystring.parse(body, '&', '=')
    }
    return next()
  })
  return req.on('error', () => {
    res.writeHead(500, { 'content-type': 'application/json' })
    res.end('{ "message": "An error ocurred parsing the POST data" }')
    return next()
  })
}
