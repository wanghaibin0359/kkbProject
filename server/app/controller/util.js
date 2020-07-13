'use strict'
const svgCaptcha = require('svg-captcha')
const fse = require('fs-extra')
const path = require('path')
const BaseController = require('./base')
class UtilController extends BaseController {
  async uploadfile() {
    const { ctx } = this
    const [file] = ctx.request.files
    const { name, hash } = ctx.request.body

    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash)
    // const filePath = paths.resolve()


    if (!fse.existsSync(chunkPath)) {
      await fse.mkdir(chunkPath)
    }
    // await fse.move(path.resolve(file.filepath), this.config.UPLOAD_DIR + '/' + file.filename)
    await fse.move(path.resolve(file.filepath), `${chunkPath}/${name}`)
    this.message('切片上传成功')
    /*  this.success({
       mesg:''
       URL: `/public/${file.filename}`,
     }) */
  }
  async mergefile() {
    const { ext, size, hash } = this.ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    await this.ctx.service.tools.mergeFile(filePath, hash, size)
    this.success('完成')
    console.log(this.app.config.UPLOAD_DIR)
  }
  async checkfile() {
    const { ctx } = this
    const { ext, hash } = ctx.request.body
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`)
    let uploaded = false
    let uploadedList = []
    if (fse.existsSync(filePath)) {
      uploaded = true
    } else {
      console.log(path.resolve(this.config.UPLOAD_DIR, hash))
      uploadedList = await this.getUploadedList(path.resolve(this.config.UPLOAD_DIR, hash))
    }
    this.success({
      uploaded, uploadedList
    })
  }
  async getUploadedList(path) {
    return fse.existsSync(path) ? (await fse.readdirSync(path)).filter(name => name[0] !== '.') : []
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
