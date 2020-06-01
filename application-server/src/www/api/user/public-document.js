const Document = require('../../../document.js')

module.exports = {
  auth: false,
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
    if (!result.public) {
      throw new Error('invalid-document')
    }
    return result
  }
}
