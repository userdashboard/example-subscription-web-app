module.exports = async (req, proxyRequestOptions) => {
  if (req.urlPath === '/' ||
      req.urlPath === '/favicon.ico' ||
      req.urlPath === '/robots.txt' ||
      req.urlPath.startsWith('/public/') || !req.account) {
    return
  }
  proxyRequestOptions.headers['x-account'] = JSON.stringify(req.account)
}
