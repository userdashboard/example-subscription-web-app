module.exports = {
  before: async (req) => {
    if (!req.urlPath.startsWith('/api/')) {
      return
    }
    req.allowAPIRequest = global.sitemap[req.urlPath] === undefined
  }
}
