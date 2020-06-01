const Document = require('../../../document.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.documentid) {
      throw new Error('invalid-documentid')
    }
    let document
    try {
      document = await Document.load(req.query.documentid)
    } catch (error) {
    }
    if (!document) {
      throw new Error('invalid-documentid')
    }
    if (document.accountid !== req.accountid) {
      throw new Error('invalid-document')
    }
    let deleted
    try {
      deleted = await Document.remove(req.query.documentid)
    } catch (error) {
      throw new Error(error.message)
    }
    return true
  }
}
