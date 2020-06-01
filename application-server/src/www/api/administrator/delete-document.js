module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.documentid) {
      throw new Error('invalid-documentid')
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
