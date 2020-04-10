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
  const organizations = await global.api.user.organizations.Organizations.get(req)
  if (organizations && organizations.length) {
    proxyRequestOptions.headers['x-organizations'] = JSON.stringify(organizations)
  }
  req.query = queryWas
}