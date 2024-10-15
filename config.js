require('dotenv').config()
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  UPN_SUFFIX: process.env.UPN_SUFFIX || 'vestfoldfylke.no',
  IMPORTED_KEYWORD: process.env.IMPORTED_KEYWORD || 'importertM365',
  NTB: {
    CLIENT_ID: process.env.NTB_CLIENT_ID,
    CLIENT_SECRET: process.env.NTB_CLIENT_SECRET,
    TOKEN_URL: process.env.NTB_TOKEN_URL,
    TOKEN_AUDIENCE: process.env.NTB_TOKEN_AUDIENCE,
    API_URL: process.env.NTB_API_URL
  },
  APPREG: {
    CLIENT_ID: process.env.APPREG_CLIENT_ID,
    CLIENT_SECRET: process.env.APPREG_CLIENT_SECRET,
    TENANT_ID: process.env.APPREG_TENANT_ID
  },
  GRAPH: {
    URL: process.env.GRAPH_URL || 'https://graph.microsoft.com',
    SCOPE: process.env.GRAPH_SCOPE || 'https://graph.microsoft.com/.default'
  },
  MAIL: {
    TO: (process.env.MAIL_TO && process.env.MAIL_TO.split(',')) || null,
    BCC: (process.env.MAIL_BCC && process.env.MAIL_BCC.split(',')) || null,
    FROM: process.env.MAIL_FROM || 'noreply@vestfoldfylke.no',
    URL: process.env.MAIL_URL,
    KEY: process.env.MAIL_KEY,
    TEMPLATE_NAME: process.env.MAIL_TEMPLATE_NAME || 'vestfoldfylke',
    DEVELOPER_EMAIL: (process.env.MAIL_DEVELOPER_EMAIL && process.env.MAIL_DEVELOPER_EMAIL.split(',')) || null,
  }
}
