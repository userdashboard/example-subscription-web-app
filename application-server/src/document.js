const fs = require('fs')
const crypto = require('crypto')
const dashboardServer = require('./dashboard-server.js')
const path = require('path')
const util = require('util')
const validExtensions = [
  'bash', 'coffee', 'cpp', 'css', 'pas',
  'diff', 'erl', 'go', 'hs', 'html', 'ini',
  'java', 'js', 'json', 'lisp', 'lua', 'md',
  'm', 'php', 'pl', 'py', 'rb', 'scala',
  'sm', 'sql', 'swift', 'tex', 'txt', 'vala',
  'vbs', 'xml'
]

const fsa = {
  readDir: util.promisify(fs.readdir),
  readFile: util.promisify(fs.readFile),
  unlink: util.promisify(fs.unlink),
  writeFile: util.promisify(fs.writeFile)
}

const basePath = process.env.BASE_PATH || path.join(__dirname, 'data')
createFolder(basePath)

module.exports = {
  create,
  load,
  list,
  remove
}

async function load (key, req) {
  const filename = `${basePath}/${md5(key)}`
  if (!fs.existsSync(filename)) {
    throw new Error('invalid-key')
  }
  createFolder(filename.substring(0, filename.lastIndexOf('/')))
  const object = await fsa.readFile(filename, 'utf8')
  if (!object || !object.length) {
    throw new Error('invalid-document')
  }
  let json
  try {
    json = JSON.parse(object)
  } catch (error) {
  }
  if (!json) {
    throw new Error('invalid-document')
  }
  json.document = await fsa.readFile(filename + '.raw')
  return json
}

async function list (key, req) {
  const folder = `${basePath}/${key}`
  if (!fs.existsSync(folder)) {
    return null
  }
  const list = await fsa.readDir(`${basePath}/${key}`, 'utf8')
  if (!list || !list.length) {
    return null
  }
  for (const n in list) {
    let metadata = await fsa.readFile(`${basePath}/${key}/${list[n]}`)
    metadata = JSON.parse(metadata)
    list[n] = await load(metadata.key, req)
  }
  return list
}

async function remove (key, req) {
  const object = await load(key, req)
  if (object.accountid !== req.accountid) {
    throw new Error('invalid-document')
  }
  var md5Key = md5(key)
  if (fs.existsSync(`${basePath}/account/${req.accountid}/${md5Key}`)) {
    await fsa.unlink(`${basePath}/account/${req.accountid}/${md5Key}`)
  }
  if (object.organizationid) {
    if (fs.existsSync(`${basePath}/organization/${object.organizationid}/${md5Key}`)) {
      await fsa.unlink(`${basePath}/organization/${object.organizationid}/${md5Key}`)
    }
  }
  await fsa.unlink(`${basePath}/${md5Key}`)
  return true
}

async function checkQuota (req) {
  const personal = await list(`account/${req.accountid}`, req)
  if (!req.organizationid) {
    return {
      unusedPersonalQuota: !personal || personal.length < 1000
    }
  }
  const organization = await list(`organization/${req.organizationid}`, req)
  return {
    unusedPersonalQuota: !personal || personal.length < 1000,
    unusedOrganizationQuota: !organization || organization.length < 1000
  }
}

async function create (req) {
  if (!req.body || !req.body.document || !req.body.document.length) {
    throw new Error('invalid-document')
  }
  if (req.body.organizationid) {
    let found = false
    const organizations = await dashboardServer.get(`/api/user/organizations/organizations?accountid=${req.accountid}&all=true`, req.accountid, req.sessionid)
    if (organizations && organizations.length) {
      for (const organization of organizations) {
        found = organization.organizationid === req.body.organizationid
        if (found) {
          break
        }
      }
    }
    if (!found) {
      throw new Error('invalid-document-owner')
    }
  }
  if (global.maxLength && req.body.document.length > global.maxLength) {
    throw new Error('invalid-document-length')
  }
  const quota = await checkQuota(req)
  if (req.body.organization && !quota.unusedOrganizationQuota) {
    throw new Error('organization-quota-exceeded')
  } else if (!req.body.organization && !quota.unusedPersonalQuota) {
    throw new Error('personal-quota-exceeded')
  }
  if (req.body.customid) {
    const parts = req.body.customid.split('.')
    if (parts.length > 2) {
      throw new Error('invalid-filename')
    } else if (parts.length === 2) {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        throw new Error('invalid-filename')
      }
      const extension = parts[parts.length - 1].toLowerCase()
      if (validExtensions.indexOf(extension) === -1) {
        throw new Error('invalid-filename-extension')
      }
    } else {
      if (/[^a-zA-Z0-9]+/.test(parts[0])) {
        throw new Error('invalid-filename')
      }
    }
    try {
      const existing = await load(req.body.customid, req)
      if (existing) {
        throw new Error('duplicate-document-id')
      }
    } catch (error) {
    }
  }
  const key = req.body.customid || await generateUniqueKey(req)
  const object = {
    accountid: req.accountid,
    created: Math.floor(new Date().getTime() / 1000),
    key: key
  }
  if (req.body.public) {
    object.public = true
  }
  if (req.body.organizationid) {
    object.organizationid = req.body.organizationid
  }
  var md5Key = md5(key)
  createFolder(`${basePath}`)
  await fsa.writeFile(`${basePath}/${md5Key}`, JSON.stringify(object), 'utf8')
  await fsa.writeFile(`${basePath}/${md5Key}.raw`, req.body.document)
  createFolder(`${basePath}/account/${req.accountid}`)
  await fsa.writeFile(`${basePath}/account/${req.accountid}/${md5Key}`, JSON.stringify(object))
  if (object.organizationid) {
    createFolder(`${basePath}/organization/${object.organizationid}`)
    await fsa.writeFile(`${basePath}/organization/${object.organizationid}/${md5Key}`, JSON.stringify(object))
  }
  return object
}

async function generateUniqueKey (req) {
  const keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  while (true) {
    let text = ''
    for (let i = 0; i < global.keyLength; i++) {
      const index = Math.floor(Math.random() * keyspace.length)
      text += keyspace.charAt(index)
    }
    try {
      await load(text, req)
    } catch (error) {
      return text
    }
  }
}

function createFolder (path) {
  const nested = path.substring(1)
  const nestedParts = nested.split('/')
  let nestedPath = ''
  for (const part of nestedParts) {
    nestedPath += `/${part}`
    const exists = fs.existsSync(nestedPath)
    if (exists) {
      continue
    }
    fs.mkdirSync(nestedPath)
  }
}

function md5 (str) {
  const md5sum = crypto.createHash('md5')
  md5sum.update(str)
  return md5sum.digest('hex')
}
