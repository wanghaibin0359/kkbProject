'use strict'

const Controller = require('egg').Controller

class HomeController extends Controller {
  async index() {
    const { ctx } = this
    console.log(ctx.request.body)
    console.log(ctx.query)
    console.log('xx')
    ctx.body = 'hi, egg'
  }
}

module.exports = HomeController
