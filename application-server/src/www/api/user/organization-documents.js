const Document = require('../../../document.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.organizationid) {
      throw new Error('invalid-organizationid')
    }
    if (!req.memberships || !req.memberships.length) {
      throw new Error('invalid-organization')
    }
    for (const membership of req.memberships) {
      if (membership.organizationid === req.query.organizationid) {
        let list
        try {
          list = await Document.listOrganization(req.query.organizationid)
        } catch (error) {
        }
        if (!list || !list.length) {
          return null
        }
        return list
      }
    }
    throw new Error('invalid-organization')
  }
}
