const Document = require('../../../document.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.documentid) {
      throw new Error('invalid-documentid')
    }
    let result
    try {
      result = await Document.load(req.query.documentid)
    } catch (error) {
    }
    if (!result) {
      throw new Error('invalid-documentid')
    }
    if (req.account.accountid !== result.accountid) {
      if (!result.organizationid) {
        throw new Error('invalid-document')
      }
      if (!req.memberships || !req.memberships.length) {
        throw new Error('invalid-document')
      }
      for (const membership of req.memberships) {
        if (membership.organizationid === result.organizationid) {
          return result
        }
      }
      throw new Error('invalid-document')
    }
    result.document = result.document.toString()
    return result
  }
}
