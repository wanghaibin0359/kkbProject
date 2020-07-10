const BaseController = require('./base')
const md5 = require('md5')
const jwt = require('jsonwebtoken')
const crteateRule = {
  email: { type: 'email' },
  nickname: { type: 'string' },
  passwd: { type: 'string' },
  captcha: { type: 'string' },
}
const HashSalt = 'asdffd'
class UserController extends BaseController {
  async login() {
    // this.success('token')
    const { ctx, app } = this
    const { email, passwd, captcha, emailCode } = ctx.request.body
    if (captcha.toUpperCase() != ctx.session.captcha.toUpperCase()) {
      return this.error('验证码错误')
    }
    if (emailCode != ctx.session.emailcode) {
      return this.error('邮箱验证码错误')
    }
    const user = await ctx.model.User.findOne({ email, passwd: md5(passwd + HashSalt) })
    if (!user) {
      return this.error('密码错误')
    }
    // 加密用户信息
    const token = jwt.sign({
      _id: user._id,
      email,
    }, app.config.jwt.secret, {
      expiresIn: '1h',
    })
    this.success({ token, email, nickname: user.nickname })
  }
  async register() {
    const { ctx } = this
    try {
      // 校验传参 的参数格式
      ctx.validate(crteateRule)
    } catch (e) {
      return this.error('参数校验失败', -1, e.errors)
    }
    const { email, passwd, nickname, captcha } = ctx.request.body
    if (captcha.toUpperCase() == ctx.session.captcha.toUpperCase()) {
      if (await this.checkEmai(email)) {
        this.error('邮箱重复啦')
      } else {
        const ret = await ctx.model.User.create({
          email,
          nickname,
          passwd: md5(passwd + HashSalt),
        })
        if (ret._id) {
          this.message('注册成功')
        }
      }
    } else {
      this.error('验证码错误')
    }
    // this.success({ name: 'whb' })
  }
  async checkEmai(email) {
    const user = await this.ctx.model.User.findOne({ email })
    return user
  }
  async verify() {
    const { ctx, app } = this
    // console.log(app.config)
    // console.log(this)
    this.success('aljk')
  }

  async info() {
    const { ctx } = this
    const { email } = ctx.state
    const user = await this.checkEmai(email)
    // 不知道
    this.success(user)
  }
}

module.exports = UserController
