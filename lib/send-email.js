const axios = require('axios').default
const { logger } = require('@vtfk/logger')
const { MAIL: { BCC, FROM, URL, KEY, TEMPLATE_NAME, DEVELOPER_EMAIL }, NODE_ENV } = require('../config')

const sendEmail = async (recipients, subject, body) => {
  if (!Array.isArray(recipients)) throw new Error("recipients must be array")
  if (NODE_ENV !== 'production') {
    logger('info', ['NODE_ENV is not production. Email will be sent to developer email', DEVELOPER_EMAIL, 'istead of recipients', recipients])
    recipients = DEVELOPER_EMAIL
  }
  if(recipients.length === 0) {
    throw new Error("No recipients. Must have at least one recipient")
  }
  const payload = {
    to: recipients,
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
