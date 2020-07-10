<template>
  <div class="login-container">
    <el-form class="login-form" :model="form" :rules="rules" ref="loginForm">
      <div class="title-container">
        <img src="/logo.gif" alt="" width="400" />
      </div>
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input
      ></el-form-item>
      <el-form-item prop="passwd" label="密码">
        <el-input v-model="form.passwd" placeholder="请输入密码"></el-input
      ></el-form-item>
      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="code.captcha" alt="" @click="captchaClick" />
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>
      <el-form-item prop="emailCode" label="验证码" class="captcha-container">
        <el-input
          v-model="form.emailCode"
          placeholder="请输入邮箱验证码"
        ></el-input>
        <el-button
          class="captcha"
          type="primary"
          @click.native="emmitEmail"
          :disabled="!!this.send.timer"
          >{{ emailMessage }}</el-button
        >
      </el-form-item>

      <el-form-item label="">
        <el-button type="primary" @click.native="submit"
          >登录</el-button
        ></el-form-item
      >
    </el-form>
  </div>
</template>

<script>
import md5 from "md5";
export default {
  layout: "login",
  data() {
    return {
      form: {
        email: "592465473@qq.com",
        passwd: "123456",
        captcha: "",
        emailCode: ""
      },
      rules: {
        email: [
          { required: true, message: "请输入邮箱", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱格式" }
        ],
        passwd: [{ required: true, message: "请输入密码", trigger: "blur" }],
        captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
        emailCode: [
          { required: true, message: "请输入邮箱验证码", trigger: "blur" }
        ]
      },
      code: {
        captcha: "/api/captcha"
      },
      send: {
        timer: 0
      }
    };
  },
  computed: {
    emailMessage() {
      if (this.send.timer > 0) {
        return `${this.send.timer}后在发送`;
      } else {
        return "点击发送";
      }
    }
  },
  methods: {
    async emmitEmail() {
      this.send.timer = 10;
      let data = await this.$http.get("/sendcode?email=" + this.form.email);
      if (data.code != 0) {
        this.$message.error("邮箱发送失败");
        return;
      }

      this.time = setInterval(() => {
        this.send.timer--;
        if (this.send.timer == 0) {
          clearInterval(this.time);
        }
      }, 1000);
    },
    submit() {
      this.$refs.loginForm.validate(async flag => {
        if (flag) {
          let obj = {
            email: this.form.email,
            nickname: this.form.nickname,
            passwd: md5(this.form.passwd),
            captcha: this.form.captcha,
            emailCode: this.form.emailCode
          };
          let ret = await this.$http.post("/user/login", obj);
          if (ret.code == 0) {
            localStorage.setItem('token',ret.data.token)
            this.$message.success("登录成功");
            this.$router.push("/");
          } else {
            this.$message.error(ret.message);
          }
        }
      });
    },
    captchaClick() {
      this.code.captcha = "/api/captcha?t=" + new Date().getTime();
    }
  }
};
</script>

<style lang="stylus"></style>
