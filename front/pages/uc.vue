<template>
    <div>
        <h1>用户中心</h1>
        <div>
            <input type="file" name="file" @change="handleFilerChange" />
        </div>
        <el-button @click="uploadFile">上传文件</el-button>
    </div>
</template>

<script>
export default {
    async mounted() {
        const ret = await this.$http.get("user/info");
        console.log(ret);
    },
    data() {
        return {
            file:null
        };
    },
    methods: {
        async uploadFile() {
            const form = new FormData();
            form.append("name", "file");
            form.append("file", this.file);
            const ret = await this.$http.post("upladfile", form);
            console.log(ret);
        },
        handleFilerChange(e) {
            const file = e.target.files[0];
            if (file) {
                this.file = file;
            }
        }
    }
};
</script>

<style></style>
