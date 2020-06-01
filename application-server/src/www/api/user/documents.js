const Document = require('../../../document.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    if (req.query.accountid !== req.accountid) {
      throw new Error('invalid-account')
    }
    let list
    try {
      list = await Document.list(req.query.accountid)
    } catch (error) {
    }
    if (!list || !list.length) {
      return null
    }
    return list
  }
}
