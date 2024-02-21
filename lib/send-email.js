const axios = require('axios').default
const { logger } = require('@vtfk/logger')
const { MAIL: { TO, BCC, FROM, URL, KEY, TEMPLATE_NAME } } = require('../config')

const sendEmail = async (subject, body) => {
  const payload = {
    to: TO,
    from: FROM,
    subject,
    template: {
      templateName: TEMPLATE_NAME,
      templateData: {
        body,
        signature: {
          name: 'Profilbildescriptet',
          title: 'Amatørfotograf',
          company: 'Robotavdelingen'
        }
      }
    }
  }
  if (BCC) payload.bcc = BCC

  const headers = { 'x-functions-key': KEY }
  const { data } = await axios.post(URL, payload, { headers })
  logger('info', ['send-mail', 'mail sent', 'to', payload.to, 'bcc', payload.bcc])
  return data
}
module.exports = {
  sendEmail
}
