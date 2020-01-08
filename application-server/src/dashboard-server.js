const bcrypt = require('./bcrypt.js')
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const util = require('util')

module.exports = {
  get: async (path, accountid, sessionid, alternativeServer, alternativeToken) => {
    return proxy('GET', path, null, accountid, sessionid, alternativeServer, alternativeToken)
  },
  post: async (path, body, accountid, sessionid, alternativeServer, alternativeToken) => {
    return proxy('POST', path, body, accountid, sessionid, alternativeServer, alternativeToken)
  },
  patch: async (path, body, accountid, sessionid, alternativeServer, alternativeToken) => {
    return proxy('PATCH', path, body, accountid, sessionid, alternativeServer, alternativeToken)
  },
  delete: async (path, body, accountid, sessionid, alternativeServer, alternativeToken) => {
    return proxy('DELETE', path, body, accountid, sessionid, alternativeServer, alternativeToken)
  }
}

const hashCache = {}
const hashCacheItems = []

const proxy = util.promisify((method, path, data, accountid, sessionid, alternativeServer, alternativeToken, callback) => {
  if (process.env.NODE_ENV === 'testing' && global.testResponse) {
    if (global.testResponse[path]) {
      return callback(null, global.testResponse[path])
    } else {
      throw new Error('invalid url ' + path)
    }
  }
  const baseURLParts = process.env.DASHBOARD_SERVER.split('://')
  let host, port
  const colon = baseURLParts[1].indexOf(':')
  if (colon > -1) {
    port = baseURLParts[1].substring(colon + 1)
    host = baseURLParts[1].substring(0, colon)
  } else if (baseURLParts[0] === 'https') {
    port = 443
    host = baseURLParts[1]
  } else if (baseURLParts[0] === 'http') {
    port = 80
    host = baseURLParts[1]
  }
  const applicationServer = alternativeServer || process.env.APPLICATION_SERVER
  const applicationServerToken = alternativeToken || process.env.APPLICATION_SERVER_TOKEN
  let token, hashText
  if (accountid) {
    hashText = `${applicationServerToken}/${accountid}/${sessionid}`
  } else {
    hashText = applicationServerToken
  }
  if (hashCache[hashText]) {
    token = hashCache[hashText]
  } else {
    const salt = bcrypt.genSaltSync(4)
    token = hashCache[hashText] = bcrypt.hashSync(hashText, salt)
    hashCacheItems.unshift(hashText)
    if (hashCacheItems > 10000) {
      hashCacheItems.pop()
    }
  }
  const requestOptions = {
    host,
    path,
    port,
    method,
    headers: {
      'x-application-server': applicationServer,
      'x-dashboard-token': token
    }
  }
  if (accountid) {
    requestOptions.headers['x-accountid'] = accountid
    requestOptions.headers['x-sessionid'] = sessionid
  }
  const protocol = baseURLParts[0] === 'https' ? https : http
  const proxyRequest = protocol.request(requestOptions, (proxyResponse) => {
    let body = ''
    proxyResponse.on('data', (chunk) => {
      body += chunk
    })
    return proxyResponse.on('end', () => {
      if (!body) {
        return callback()
      }
      if (proxyResponse.statusCode === 200) {
        if (proxyResponse.headers['content-type'] === 'application/json') {
          return callback(null, JSON.parse(body))
        } else {
          return callback(null, body)
        }
      }
      if (body && proxyResponse.headers['content-type'] === 'application/json') {
        body = JSON.parse(body)
        return callback(new Error(body.error))
      }
      return callback(new Error('dashboard-error'))
    })
  })
  proxyRequest.on('error', (error) => {
    return callback(error)
  })
  if (data) {
    proxyRequest.write(querystring.stringify(data))
  }
  return proxyRequest.end()
})
