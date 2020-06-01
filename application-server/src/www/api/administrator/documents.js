module.exports = {
  get: async (req) => {
    let accountid
    if (req.query && req.query.accountid) {
      accountid = req.query.accountid
    }
    let list
    try {
      list = await Document.list(accountid)
    } catch (error) {
    }
    if (!list || !list.length) {
      return null
    }
    return list
  }
}
