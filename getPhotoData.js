(async () => {
  const axios = require('axios').default
  const { writeFileSync } = require('fs')
  const { getPhotoAsBase64 } = require('./lib/call-ntb')
  try {
    // const result = await getPhotoAsBase64('tyjO4amUe90')
    // writeFileSync('./photoData.txt', result)
    const result = await axios.get('https://preview.sdl.no/v2/dam/6Puj2ASJ_bhJeev8au4TOg/tyjO4amUe90?v=1706615322341', { responseType: 'arraybuffer' })
    const base64 = Buffer.from(result.data, 'binary').toString('base64')
    writeFileSync('./photoData.json', JSON.stringify(result.headers, null, 2))
    writeFileSync('./photoBase64.txt', base64)

    // console.log(result)
  } catch (error) {
    console.log(error.response?.data || error.stack || error.toString())
  }
})()
