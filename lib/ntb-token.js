const { NTB } = require('../config')
const { logger } = require('@vtfk/logger')
const Cache = require('file-system-cache').default
const axios = require('axios').default

const tokenCache = Cache({
  basePath: './.token-cache'
})

module.exports = async (forceNew = false) => {
  const cacheKey = 'NTBToken'

  const cachedToken = tokenCache.getSync(cacheKey)
  if (!forceNew && cachedToken) {
    // logger('info', ['getNTBToken', 'found valid token in cache, will use that instead of fetching new'])
    return cachedToken.substring(0, cachedToken.length - 2)
  }

  logger('info', ['getNTBToken', 'no token in cache, fetching new from NTB'])

  const tokenPayload = {
    grant_type: 'client_credentials',
    client_id: NTB.CLIENT_ID,
    client_secret: NTB.CLIENT_SECRET,
    audience: NTB.TOKEN_AUDIENCE
  }
  const { data } = await axios.post(NTB.TOKEN_URL, tokenPayload)

  logger('info', ['getNTBToken', 'token fetched from NTB'])
  tokenCache.setSync(cacheKey, `${data.access_token}==`, data.expires_in) // Haha, just to make the cached token not directly usable
  logger('info', ['getNTBToken', 'token cached for further use', `Token expires in ${data.expires_in} seconds`])
  return data.access_token
}
