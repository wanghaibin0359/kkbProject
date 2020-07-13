const jwt = require('jsonwebtoken')
module.exports = ({ app }) => async (ctx, next) => {
  if (!ctx.request.header.authorization) {
    ctx.body = {
      code: -1,
      message: '用户未登录',
    }
    return
  }
  const token = ctx.request.header.authorization.replace('Bearer ', '')
  try {
    const ret = jwt.verify(token, app.config.jwt.secret)
    ctx.state.email = ret.email
    ctx.state.userid = ret._id
    await next()
  } catch (e) {
    if (e.name == 'TokenExpiredError') {
      ctx.body = {
        code: -666,
        message: '登录已过期',
      }
    } else {
      ctx.body = {
        code: -666,
        message: '用户信息出错',
      }
    }
  }
}
