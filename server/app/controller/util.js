'use strict'
const svgCaptcha = require('svg-captcha')
const fse = require('fs-extra')
const path = require('path')
const BaseController = require('./base')
class UtilController extends BaseController {
  async upladfile() {
    const { ctx } = this
    const [ file ] = ctx.request.files
    const { name } = ctx.request.body
    console.log(path.resolve(file.filepath))
    await fse.move(path.resolve(file.filepath), this.config.UPLOAD_DIR + '/' + file.filename)
    this.success({
      URL: `/public/${file.filename}`,
    })
  }
  async captcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      fontSize: 50,
      width: 100,
      height: 50,
      noise: 3,
    })
    console.log('===>>>>   ' + captcha.text)
    this.ctx.session.captcha = captcha.text
    this.ctx.response.type = 'image/svg+xml'
    this.ctx.body = captcha.data
  }
  async sendcode() {
    const { ctx } = this
    const email = ctx.query.email
    const code = Math.random().toString().slice(2, 6)
    console.log(`邮箱 ${email} 验证码 ${code}`)
    ctx.session.emailcode = code
    const subject = 'Nbproject验证码'
    const text = 'hello word'
    const html = `<h2>斌哥社区</h2><a href='https://kaikeba.com' >${code}</a>`
    const hasSend = await this.service.tools.sendMail(email, subject, text, html)
    if (hasSend) {
      this.message('发送成功')
    } else {
      this.error('发送失败')
    }
  }
}

module.exports = UtilController
