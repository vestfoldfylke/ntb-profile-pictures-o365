const { default: axios } = require('axios')
const { GRAPH } = require('../config')
const { getGraphToken } = require('./graph-token')

/**
 *
 * @param {string} resource e.g "/v1.0/users/per.sol@domain.com?$select=userPrincipalName"
 * @returns {Promise<data>} graphData
 */
const getGraphData = async (resource, advanced = false) => {
  const accessToken = await getGraphToken()
  const headers = { Authorization: `Bearer ${accessToken}` }
  if (advanced) headers.ConsistencyLevel = 'eventual'
  const { data } = await axios.get(`${GRAPH.URL}/${resource}`, { headers })
  return data
}
// Base64 is not longer supported. Use binary
const updateGraphPhoto = async (userPrincipalName, photoData) => {
  const accessToken = await getGraphToken()
  const headers = { Authorization: `Bearer ${accessToken}`, ContentType: 'image/jpeg' }
  const response = await axios.put(`${GRAPH.URL}/v1.0/users/${userPrincipalName}/photo/$value`, photoData, { headers })
  return response
}
module.exports = {
  getGraphData, updateGraphPhoto
}
