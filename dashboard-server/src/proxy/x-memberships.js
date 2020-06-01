module.exports = async (req, proxyRequestOptions) => {
  if (req.urlPath === '/' ||
      req.urlPath === '/favicon.ico' ||
      req.urlPath === '/robots.txt' ||
      req.urlPath.startsWith('/public/') || !req.account) {
    return
  }
  const queryWas = {}
  req.query = {
    all: true,
    accountid: req.account.accountid
  }
  const memberships = await global.api.user.organizations.Memberships.get(req)
  if (memberships && memberships.length) {
    proxyRequestOptions.headers['x-memberships'] = JSON.stringify(memberships)
  }
  req.query = queryWas
}
