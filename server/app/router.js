'use strict'

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app
  const jwt = app.middleware.jwt({ app })
  router.get('/', controller.home.index)
  router.post('/', controller.home.index)
  router.get('/captcha', controller.util.captcha)
  router.get('/sendcode', controller.util.sendcode)
  router.post('/uploadfile', controller.util.uploadfile)
  router.post('/merge', controller.util.mergefile)
  router.post('/checkfile', controller.util.checkfile)


  router.group({ name: 'user', prefix: '/user' }, router => {
    const { info, register, login, verify } = controller.user
    router.post('/register', register)
    router.post('/login', login)
    router.get('/info', jwt, info)
    router.get('/verify', verify)
  })

  // /user/register
  // /user/login
  // /user/follow
}
