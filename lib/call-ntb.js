const getNTBtoken = require('./ntb-token')
const axios = require('axios').default
const { NTB } = require('../config')
const { logger } = require('@vtfk/logger')

/**
 *
 * @param {*} albumName
 * @returns {import('./typedef').photo[]} Photo
 */
const getPhotosFromAlbum = async (albumName) => {
  let photos = []
  let finished = false
  let offset = 0
  const limit = 199
  while (!finished) {
    // kjør spørringer frem til vi har fått bekreftet at vi har fått de siste bildene. Hvis vi har det, sett finished = true
    const accessToken = await getNTBtoken()
    const url = `${NTB.API_URL}?albums=35068&limit=${limit}&offset=${offset}`
    logger('info', ['get-photos-from-album', `Running GET on URL: ${url}`])
    const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    if (!data._status.success) {
      throw new Error(`Feilet ved henting av bilder, Status: ${data._status.status}, message: ${data._status.message}`)
    }
    logger('info', ['get-photos-from-album', `got response of URL ${data._page.count} profile photos`, `Status: ${data._status.status} - Message: ${data._status.message} - Success: ${data._status.success}`])
    photos = [...photos, ...data._data]
    offset += limit
    if (offset > data._page.total) {
      finished = true
      logger('info', ['get-photos-from-album', `got a total of ${photos.length} profile photos`])
    }
  }
  return photos
}
const getPhotoAsBase64 = async (id) => {
  const accessToken = await getNTBtoken()
  // https://api.ntb.no/media/v1/{archive}/download/{id}
  const url = `${NTB.API_URL}download/${id}`
  logger('info', ['get-photo-as-base64', `Running GET on URL: ${url}`])
  const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  logger('info', ['get-photo-as-base64', 'got response of URL'])
  const base64 = Buffer.from(data).toString('base64')
  return base64
}
const getPreviewPhotoAsBase64 = async (previewUrl) => {
  logger('info', ['get-photo-as-base64', `Running GET on URL: ${previewUrl}`])
  const { data } = await axios.get(previewUrl, { responseType: 'arraybuffer' })
  logger('info', ['get-photo-as-base64', 'got response of URL'])
  const base64 = Buffer.from(data, 'binary').toString('base64')
  return base64
}
const getPreviewPhotoRaw = async (previewUrl) => {
  logger('info', ['get-photo-raw', `Running GET on URL: ${previewUrl}`])
  const { data } = await axios.get(previewUrl, { responseType: 'arraybuffer' })
  logger('info', ['get-photo-raw', 'got response of URL'])
  // const raw = Buffer.from(data, 'binary')
  return Buffer.from(data, 'binary')
}
const updatePhoto = async (id, properties) => {
  const accessToken = await getNTBtoken()
  // https://api.ntb.no/media/v1/{archive}/{id}
  const url = `${NTB.API_URL}${id}`
  logger('info', ['update-photo', `Running PATCH on URL: ${url}`, 'Properties', properties ])
  const { data } = await axios.patch(url, properties, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!data._status.success) {
    throw new Error(`Feilet ved oppdatering av metadata til bildet. Status: ${data._status.status}, message: ${data._status.message}`)
  }
  logger('info', ['update-photo', 'got response of URL', 'Status', data._status])
  return data
}
module.exports = { getPhotosFromAlbum, getPhotoAsBase64, getPreviewPhotoAsBase64, updatePhoto, getPreviewPhotoRaw }