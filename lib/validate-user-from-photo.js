const { logger } = require('@vtfk/logger')
const { UPN_SUFFIX } = require('../config')
const { getGraphData } = require('./call-graph')
const { appendFileSync } = require('fs')

const getUserIdentifierByTitle = (photo) => {
  let identifier
  if (photo.headline && photo.headline.length > 2 && (photo.headline.includes(' ') || photo.headline.includes('.'))) identifier = photo.headline
  else identifier = photo.file.originalFilename.replaceAll('.jpg', '')
  if (identifier.includes(' ')) {
    return {
      displayName: identifier
    }
  }
  if (identifier.includes('.')) {
    if (identifier.includes('@')) identifier = identifier.substring(0, identifier.indexOf('@'))
    identifier = identifier.toLowerCase().replaceAll('æ', 'e').replaceAll('ø', 'o').replaceAll('å', 'aa').replaceAll('ü', 'u').replaceAll('ö', 'o').replaceAll('á', 'a').replaceAll('à', 'a')
    return {
      upn: `${identifier}@${UPN_SUFFIX}`
    }
  }
  return null
}

/**
 *
 * @param {import('./typedef').photo} photo
 * @returns
 */
const validateUserFromPhoto = async (photo) => {
  // hente ut feletet der navnet og upn potensielt ligger
  const userIdentifier = getUserIdentifierByTitle(photo)
  if (!userIdentifier) return null
  // søk opp brukeren i Graph
  if (userIdentifier.upn) {
    try {
      const graphUser = await getGraphData(`/v1.0/users/${userIdentifier.upn}`)
      return graphUser
    } catch (error) {
      logger('warn', [`Feilet ved henting av bruker med upn-spørring ${userIdentifier.upn}`])
      if (error.response?.status !== 404) {
        throw error
      }
      return null
    }
  }
  if (userIdentifier.displayName) {
    const graphUser = await getGraphData(`/v1.0/users?$search="displayName:${userIdentifier.displayName}"&$select=id,displayName,userPrincipalName&$filter=endswith(userPrincipalName,'@${UPN_SUFFIX}')&$count=true`, true)
    if (graphUser.value.length === 1) return graphUser.value[0]
    if (graphUser.value.length > 1) {
      appendFileSync('./severalUsers.txt', `${JSON.stringify(graphUser.value)} \n`)
    }
    return null // det ble ikke funnet noen eller det ble funnet flere. Begge deler er feil
  }
  throw new Error('Hit kommer vi aldri!! Hilsen Jørgen')
}
module.exports = { validateUserFromPhoto }
