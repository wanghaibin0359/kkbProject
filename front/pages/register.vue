<template>
  <div class="login-container">
    <el-form class="login-form" :model="form" :rules="rules" ref="registerForm">
      <div class="title-container">
        <img src="/logo.gif" alt="" width="400" />
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input
      ></el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha"><img :src="code.captcha" alt=""  @click="captchaClick" /></div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>
      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input
      ></el-form-item>
      <el-form-item prop="passwd" label="密码">
        <el-input v-model="form.passwd" placeholder="请输入密码"></el-input
      ></el-form-item>
      <el-form-item prop="repasswd" label="确认密码">
        <el-input
          v-model="form.repasswd"
          placeholder="请再次确认密码"
        ></el-input
      ></el-form-item>
      <el-form-item  label="">
        <el-button type="primary" @click.native="submit">注册</el-button></el-form-item
      >
    </el-form>
  </div>
</template>

<script>
import md5 from 'md5'
export default {
  layout: "login",
  data() {
    return {
      form: {
        email: "592465473@qq.com",
        nickname: "小小玩家",
        passwd: "123456",
        captcha: "",
        repasswd: "123456"
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱格式" }
        ],
        nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
        passwd: [{ required: true, message: "请输入密码", trigger: "blur" }],
        repasswd: [
          { required: true, message: "请输入密码", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (value !== this.form.passwd) {
                callback(new Error("两次输入密码不一致"));
              }
                callback();
              
            },
            trigger: "blur"
          }
        ],
        captcha: [
          { required: true, message: "请输入验证码", trigger: "blur" },
        ]
      },
      code: {
        captcha: "/api/captcha"
      }
    };
  },
  methods: {
      submit(){
          this.$refs.registerForm.validate(async flag=>{
              if(flag){
                  let obj={
                      email:this.form.email,
                      nickname:this.form.nickname,
                      passwd:md5(this.form.passwd),
                      captcha:this.form.captcha,
                  }
                  let ret = await this.$http.post('/user/register',obj)
                  if(ret.code==0){
                      this.$alert('注册成功','success',{
                          confirmButtonText:"去登陆",
                            callback:() =>{
                                this.$router.push('/login')
                            }
                      })
                  }else{
                      this.$message.error(ret.message)
                  }
              }
          })
      },
       captchaClick(){
          this.code.captcha = "/api/captcha?t="+new Date().getTime()
      }
  }
};
</script>

<style lang="stylus"></style>
