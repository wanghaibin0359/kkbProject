!<template>
  <div>
    <!-- <div>
      导航
    </div> -->
    <Nuxt />
    <!-- <div>flooter</div> -->
  </div>
</template>

<script>
export default {};
</script>

<style lang="stylus">
.login-container
    width:100%
    min-height 100%
    .login-form
        width 700px
        padding 160px
        margin 0 auto
        overflow hidden
    .title-container
        text-align center
        img
            width 200px
    .captcha-container
        position relative
        width 280px
        .captcha
            position absolute
            right -110px
            &.el-button
                width 100px
            img
                cursor pointer
         
</style>
