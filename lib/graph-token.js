const { ConfidentialClientApplication } = require("@azure/msal-node")
const { APPREG, GRAPH } = require('../config')
const { logger } = require('@vtfk/logger')
const Cache = require('file-system-cache').default

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

  if (!APPREG.CLIENT_ID || !APPREG.CLIENT_SECRET || !APPREG.TENANT_ID) {
    throw new Error("Missing configuration for MSAL. Please set correct in .env: APPREG_CLIENT_ID, APPREG_CLIENT_SECRET, APPREG_TENANT_ID")
  }

  const confidentialClientApplication = new ConfidentialClientApplication({
    auth: {
      clientId: APPREG.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${APPREG.TENANT_ID}/`,
      clientSecret: APPREG.CLIENT_SECRET
    }
  })

  const tokenResponse = await confidentialClientApplication.acquireTokenByClientCredential({
    scopes: [GRAPH.SCOPE]
  })

  if (!tokenResponse?.accessToken) {
    throw new Error(`Failed to get access token for scope '${GRAPH.SCOPE}': MSAL returned no token. Check the app registration's client secret and API permissions.`)
  }

  if (!tokenResponse.expiresOn) {
    throw new Error(`Failed to get access token for scope '${GRAPH.SCOPE}': MSAL returned no expiry for the token. Will not continue.`)
  }

  const expires = Math.floor((tokenResponse.expiresOn.getTime() - new Date()) / 1000)
  logger('info', ['getGraphToken', `Got token from Microsoft, expires in ${expires} seconds.`])
  tokenCache.setSync(cacheKey, `${tokenResponse.accessToken}==`, expires) // Haha, just to make the cached token not directly usable
  logger('info', ['getGraphToken', 'Token stored in cache'])
  return tokenResponse.accessToken
}

module.exports = {
  getGraphToken
}
