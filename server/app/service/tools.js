const { Service } = require('egg')
const mailer = require('nodemailer')

const user = '15268638853@163.com'
const transport = mailer.createTransport({
  service: '163',
  auth: {
    user,
    pass: 'wang15268638853',
  },
})


class ToolService extends Service {
  async sendMail(email, subject, text, html) {
    const mailOptions = {
      from: user,
      to: email,
      subject,
      text, html,
      cc: user,
    }
    try {
      await transport.sendMail(mailOptions)
      return true
    } catch (e) {
      console.log(e)
      return false
    }
  }
}

module.exports = ToolService
