const { APPREG, GRAPH } = require('../config')
const { logger } = require('@vtfk/logger')
const Cache = require('file-system-cache').default
const { getAccessToken } = require('@vestfoldfylke/msal-token')

const tokenCache = Cache({
  basePath: './.token-cache'
})

const getGraphToken = async (forceNew = false) => {
  const cacheKey = 'GraphToken'

  const cachedToken = tokenCache.getSync(cacheKey)
  if (!forceNew && cachedToken) {
    // logger('info', ['getGraphToken', 'found valid token in cache, will use that instead of fetching new'])
    return cachedToken.substring(0, cachedToken.length - 2)
  }

  logger('info', ['getGraphToken', 'no token in cache, fetching new from graph'])

  const clientConfig = {
    clientId: APPREG.CLIENT_ID,
    clientSecret: APPREG.CLIENT_SECRET,
    tenantId: APPREG.TENANT_ID,
    scopes: [GRAPH.SCOPE]
  }
  const token = await getAccessToken(clientConfig)
  const expires = Math.floor((token.expiresOn.getTime() - new Date()) / 1000)
  logger('info', ['getGraphToken', `Got token from Microsoft, expires in ${expires} seconds.`])
  tokenCache.setSync(cacheKey, `${token.accessToken}==`, expires) // Haha, just to make the cached token not directly usable
  logger('info', ['getGraphToken', 'Token stored in cache'])
  return token.accessToken
}

module.exports = {
  getGraphToken
}
