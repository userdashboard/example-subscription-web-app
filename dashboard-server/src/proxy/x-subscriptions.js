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
  const subscriptions = req.proxySubscriptions = req.proxySubscriptions || await global.api.user.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    proxyRequestOptions.headers['x-subscriptions'] = JSON.stringify(subscriptions)
  }
  req.query = queryWas
}
