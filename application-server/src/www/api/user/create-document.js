const Document = require('../../../document.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.accountid) {
      throw new Error('invalid-account')
    }
    if (!req.body || !req.body.document || !req.body.document.length) {
      throw new Error('invalid-document')
    }
    if (global.maxLength && req.body.document.length > global.maxLength) {
      throw new Error('invalid-document-length')
    }
    if (req.body.documentid) {
      const parts = req.body.documentid.split('.')
      if (parts.length > 2) {
        throw new Error('invalid-filename')
      } else if (parts.length === 2) {
        if (/[^a-zA-Z0-9]+/.test(parts[0])) {
          throw new Error('invalid-filename')
        }
        const extension = parts[parts.length - 1].toLowerCase()
        if (Document.validExtensions.indexOf(extension) === -1) {
          throw new Error('invalid-filename-extension')
        }
      } else {
        if (/[^a-zA-Z0-9]+/.test(parts[0])) {
          throw new Error('invalid-filename')
        }
      }
      try {
        const existing = await load(req.body.documentid)
        if (existing) {
          throw new Error('duplicate-documentid')
        }
      } catch (error) {
      }
    }
    if (req.body.organizationid) {
      if (!req.memberships || !req.memberships.length) {
        throw new Error('invalid-organization')
      }
      let found 
      for (const membership of req.memberships) {
        found = membership.organizationid === req.body.organizationid
        if (found) {
          break
        }
      }
      if (!found) {
        throw new Error('invalid-organization')
      }
    }
    let document
    try {
      document = await Document.create(
        req.body.document, 
        req.body.documentid, 
        req.body.public, 
        req.query.accountid,
        req.body.organizationid
      )
    } catch (error) {
      throw new Error(error.message)
    }
    return document
  }
}