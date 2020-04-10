const fs = require('fs')
const crypto = require('crypto')
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
  listOrganization,
  validExtensions,
  remove
}

async function load (documentid) {
  if (!documentid || !documentid.length) {
    throw new Error('invalid-documentid')
  }
  const md5Key = md5(documentid)
  const filename = `${basePath}/${md5Key}`
  if (!fs.existsSync(filename)) {
    throw new Error('invalid-documentid')
  }
  createFolder(filename.substring(0, filename.lastIndexOf('/')))
  const object = await fsa.readFile(filename)
  if (!object || !object.length) {
    throw new Error('invalid-document')
  }
  let json
  try {
    json = JSON.parse(object.toString())
  } catch (error) {
  }
  if (!json) {
    throw new Error('invalid-document')
  }
  json.document = await fsa.readFile(filename + '.raw')
  json.document = json.document.toString()
  return json
}

async function list (accountid) {
  const folder = `${basePath}/account/${accountid}`
  if (!fs.existsSync(folder)) {
    return null
  }
  const list = await fsa.readDir(folder, 'utf8')
  if (!list || !list.length) {
    return null
  }
  for (const n in list) {
    let metadata = await fsa.readFile(`${folder}/${list[n]}`)
    metadata = JSON.parse(metadata.toString())
    list[n] = await load(metadata.key)
  }
  return list
}

async function listOrganization (organizationid) {
  const folder = `${basePath}/organization/${organizationid}`
  if (!fs.existsSync(folder)) {
    return null
  }
  const list = await fsa.readDir(folder, 'utf8')
  if (!list || !list.length) {
    return null
  }
  for (const n in list) {
    let metadata = await fsa.readFile(`${folder}/${list[n]}`)
    list[n] = JSON.parse(metadata.toString())
  }
  return list
}

async function remove (documentid) {
  if (!documentid || !documentid.length) {
    throw new Error('invalid-documentid')
  }
  const object = await load(documentid)
  var md5Key = md5(documentid)
  if (fs.existsSync(`${basePath}/account/${object.accountid}/${md5Key}`)) {
    await fsa.unlink(`${basePath}/account/${object.accountid}/${md5Key}`)
  }
  if (object.organizationid) {
    if (fs.existsSync(`${basePath}/organization/${object.organizationid}/${md5Key}`)) {
      await fsa.unlink(`${basePath}/organization/${object.organizationid}/${md5Key}`)
    }
  }
  await fsa.unlink(`${basePath}/${md5Key}`)
  return true
}

async function create (document, documentid, public, accountid, organizationid) {
  if (!document || !document.length) {
    throw new Error('invalid-document')
  }
  if (global.maxLength && document.length > global.maxLength) {
    throw new Error('invalid-document-length')
  }
  if (documentid) {
    const parts = documentid.split('.')
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
      const existing = await load(documentid)
      if (existing) {
        throw new Error('duplicate-documentid')
      }
    } catch (error) {
    }
  }
  const key = documentid || await generateUniqueKey()
  const object = {
    accountid: accountid,
    created: Math.floor(new Date().getTime() / 1000),
    key: key
  }
  if (public) {
    object.public = true
  }
  if (organizationid) {
    object.organizationid = organizationid
  }
  const md5Key = md5(key)
  const objectJSON = JSON.stringify(object)
  createFolder(`${basePath}`)
  await fsa.writeFile(`${basePath}/${md5Key}`, objectJSON, 'utf8')
  await fsa.writeFile(`${basePath}/${md5Key}.raw`, document.toString())
  createFolder(`${basePath}/account/${accountid}`)
  await fsa.writeFile(`${basePath}/account/${accountid}/${md5Key}`, objectJSON)
  if (object.organizationid) {
    createFolder(`${basePath}/organization/${object.organizationid}`)
    await fsa.writeFile(`${basePath}/organization/${object.organizationid}/${md5Key}`, objectJSON)
  }
  return object
}

async function generateUniqueKey () {
  const keyspace = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  while (true) {
    let text = ''
    for (let i = 0; i < global.keyLength; i++) {
      const index = Math.floor(Math.random() * keyspace.length)
      text += keyspace.charAt(index)
    }
    try {
      await load(text)
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
