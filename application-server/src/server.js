const Document = require('./document.js')
const fs = require('fs')
const http = require('http')
const Multiparty = require('multiparty')
const path = require('path')
const querystring = require('querystring')
const util = require('util')

const apiCache = {}
const fileCache = {}
const errorPage = fs.readFileSync(path.join(__dirname, '/www/error.html')).toString()
const homePage = fs.readFileSync(path.join(__dirname, '/www/home.html')).toString()
const publicPage = fs.readFileSync(path.join(__dirname, '/www/public.html')).toString()
const indexPage = fs.readFileSync(path.join(__dirname, '/www/index.html')).toString()
const wwwPath = path.join(__dirname, 'www')
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
  start: async (port, host) => {
    server = await http.createServer(receiveRequest).listen(port, host)
  },
  stop: async () => {
    if (server) {
      server.close()
      server = null
    }
  }
}

const parsePostData = util.promisify((req, callback) => {
  if (req.headers &&
      req.headers['content-type'] &&
      req.headers['content-type'].indexOf('multipart/form-data') > -1) {
    return callback()
  }
  let body = ''
  req.on('data', (data) => {
    body += data
  })
  return req.on('end', () => {
    if (!body) {
      return callback()
    }
    return callback(null, body)
  })
})

const parseMultiPartData = util.promisify((req, callback) => {
  const form = new Multiparty.Form()
  return form.parse(req, async (error, fields) => {
    if (error) {
      return callback(error)
    }
    const body = {}
    for (const field in fields) {
      body[field] = fields[field][0]
    }
    return callback(null, body)
  })
})

async function staticFile (req, res) {
  const filePath = path.join(wwwPath, req.urlPath)
  const extension = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase()
  const mimeType = mimeTypes[extension]
  if (!mimeType) {
    return throw500(req, res)
  }
  let blob
  if (!process.env.HOT_RELOAD) {
    blob = fileCache[filePath]
  }
  if (blob) {
    res.setHeader('content-type', mimeType)
    return res.end(blob)
  }
  if (!fs.existsSync(filePath)) {
    return throw404(req, res)
  }
  const stat = fs.statSync(filePath)
  if (stat.isDirectory()) {
    return throw404(req, res)
  }
  blob = fs.readFileSync(filePath)
  fileCache[filePath] = blob
  res.setHeader('content-type', mimeType)
  return res.end(blob)
}

function throw404 (req, res) {
  return throwError(req, res, 404)
}

function throw500 (req, res) {
  return throwError(req, res, 500)
}

function throw511 (req, res) {
  return throwError(req, res, 511)
}

function throwError (req, res, error) {
  if (req.urlPath.startsWith('/api/')) {
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.statusCode = error
    return res.end(`{ "error": "An error ${error} ocurred" }`)
  }
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.statusCode = error
  return res.end(errorPage)
}

async function receiveRequest (req, res) {
  const question = req.url.indexOf('?')
  if (question > -1) {
    req.query = querystring.parse(req.url.substring(question + 1), '&', '=')
  }
  req.urlPath = req.url.split('?')[0]
  if (req.urlPath === '/') {
    res.setHeader('content-type', 'text/html')
    return res.end(indexPage)
  }
  if (req.urlPath === '/favicon.ico' ||
      req.urlPath === '/robots.txt' ||
      req.urlPath.startsWith('/public/')) {
    return staticFile(req, res)
  }
  req.verified = req.headers['x-dashboard-server'] === global.dashboardServer &&
                 req.headers['x-application-server-token'] === global.applicationServerToken
  if (!req.verified) {
    return throw500(req, res)
  }
  if (req.headers['x-account']) {
    req.accountid = req.headers['x-accountid']
    req.sessionid = req.headers['x-sessionid']
    if (req.headers['x-account']) {
      req.account = JSON.parse(req.headers['x-account'])
    }
    if (req.headers['x-organizations']) {
      req.organizations = JSON.parse(req.headers['x-organizations'])
    }
    if (req.headers['x-memberships']) {
      req.memberships = JSON.parse(req.headers['x-memberships'])
    }
  }
  if (!req.accountid) {
    return throw511(req, res)
  }
  if (req.urlPath === '/home') {
    res.setHeader('content-type', 'text/html')
    const user = {
      account: req.account,
      session: req.session
    }
    if (req.organizations) {
      user.organizations = req.organizations
    }
    if (req.memberships) {
      user.memberships = req.memberships
    }
    const injectJS = [`window.user = ${JSON.stringify(user)}`]
    if (global.publicDomain) {
      injectJS.push(`window.publicDomain = "${global.publicDomain}"</script>`)
    }
    const homePageText = homePage.replace('<head>', '<head><script>' + injectJS.join('\n') + '</script>')
    return res.end(homePageText)
  }
  if (req.urlPath.startsWith('/document/')) {
    res.setHeader('content-type', 'text/html')
    const user = {
      account: req.account || 'guest',
      session: req.session || 'guest'
    }
    if (req.organizations) {
      user.organizations = req.organizations || []
    }
    if (req.memberships) {
      user.memberships = req.memberships || []
    }
    const postid = req.urlPath.substring('/document/'.length)
    const injectJS = [`window.user = ${JSON.stringify(user)}`]
    let post
    try {
      post = await Document.load(postid)
    } catch (error) {
    }
    if (!post || !post.public) {
      return throw404(req, res)
    }
    injectJS.push(`window.post = ${JSON.stringify(post)}`)
    if (global.publicDomain) {
      injectJS.push(`window.publicDomain = "${global.publicDomain}"</script>`)
    }
    const publicPageText = publicPage.replace('<head>', '<head><script>' + injectJS.join('\n') + '</script>')
    return res.end(publicPageText)
  }
  if (!req.urlPath.startsWith('/api/')) {
    return throw404(req, res)
  }
  if (req.urlPath.startsWith('/administrator/')) {
    if (!req.account.administrator) {
      return throw500(req, res)
    }
  }
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE') {
    if (req.headers['content-type'] && req.headers['content-type'].indexOf('multipart/form-data;') > -1) {
      try {
        req.body = await parseMultiPartData(req)
      } catch (error) {
        return throw500(req, res)
      }
    }
    if (!req.body) {
      try {
        req.bodyRaw = await parsePostData(req)
      } catch (error) {
        return throw500(req, res)
      }
      if (req.bodyRaw) {
        req.body = querystring.parse(req.bodyRaw, '&', '=')
      }
    }
  }
  const apiPath = path.join(wwwPath, `${req.urlPath}.js`)
  if (!fs.existsSync(apiPath)) {
    return throw404(req, res)
  }
  let api
  if (!process.env.HOT_RELOAD) {
    api = apiCache[apiPath]
    if (!api) {
      api = apiCache[apiPath] = require(apiPath)
    }
  } else {
    delete require.cache[require.resolve(apiPath)]
    api = require(apiPath)
  }
  const method = req.method.toLowerCase()
  if (!api[method]) {
    return throw404(req, res)
  }
  if (api.auth !== false && !req.account) {
    return throw511(req, res)
  }
  let result
  try {
    result = await api[method](req)
  } catch (error) {
    return throw500(req, res)
  }
  if (!result) {
    return res.end()
  }
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
  return res.end(JSON.stringify(result))
}
