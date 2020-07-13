const { Service } = require('egg')
const mailer = require('nodemailer')
const path = require('path')
const fse = require('fs-extra')
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
  async mergeFile(filePath, hash, size) {
    const chunkDir = path.resolve(this.config.UPLOAD_DIR, hash)
    let chunks = await fse.readdir(chunkDir)
    chunks.sort((a, b) => a.split('-')[1] - b.split('-')[1])
    chunks = chunks.map(cp => path.resolve(chunkDir, cp))
    await this.mergeChunks(chunks, filePath, size)
    return true
  }
  async mergeChunks(files, dest, size) {
    const pipStream = (filePath, writeStream) => new Promise((res) => {
      const readStream = fse.createReadStream(filePath)
      readStream.on('end', () => {
       // fse.unlinkSync(filePath)
        res()
      })
      readStream.pipe(writeStream)
    })
    await Promise.all(files.map((file, index) => {
      return pipStream(file, fse.createWriteStream(dest, {
        start: index * size,
        end: (index + 1) * size
      }))
    }))
  }
}

module.exports = ToolService
