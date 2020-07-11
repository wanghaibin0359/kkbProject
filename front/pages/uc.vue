<template>
    <div>
        <h1>用户中心</h1>
        <div>
            <div ref="drag" id="drag">
                <input type="file" name="file" @change="handleFilerChange" />
            </div>
        </div>
        <div style="width:200px;">
            <el-progress :percentage="uploadProgess" :text-inside="true" :stroke-width="20"></el-progress>
        </div>
        <el-button @click="uploadFile">上传文件</el-button>

        <div style="width:200px;">
            <p>计算hash进度</p>
            <el-progress :percentage="hashProgress" :text-inside="true" :stroke-width="20"></el-progress>
        </div>
    </div>
</template>

<script>
import sparkMD5 from "spark-md5";
const CHUNK_SIZE = 0.1 * 1024 * 1024;
export default {
    async mounted() {
        const ret = await this.$http.get("user/info");
        this.bindEvents();
    },
    data() {
        return {
            file: null,
            uploadProgess: 50,
            hashProgress: 0,
            chunks: []
        };
    },
    methods: {
        blobToString(blob) {
            return new Promise(reslove => {
                let reader = new FileReader();
                reader.onload = function() {
                    let ret = reader.result.split("");
                    let arr = ret.map(item =>
                        item
                            .charCodeAt()
                            .toString(16)
                            .toUpperCase()
                            .padStart(2, "0")
                    );
                    reslove(arr.join(" "));
                };
                reader.readAsBinaryString(blob);
            });
        },
        async isPng(file) {
            let ret = await this.blobToString(file.slice(0, 8));
            if (ret === "89 50 4E 47 0D 0A 1A 0A") {
                return true;
            }
            return false;
        },
        isImage(file) {
            return this.isPng(file);
        },
        bindEvents() {
            const drag = this.$refs.drag;
            drag.addEventListener("dragover", e => {
                drag.style.borderColor = "red";
                e.preventDefault();
            });
            drag.addEventListener("dragleave", e => {
                drag.style.borderColor = "#eee";
                e.preventDefault();
            });
            drag.addEventListener("drop", e => {
                console.log(e);
                this.file = e.dataTransfer.files[0];
                console.log(this.file);
                drag.style.borderColor = "#eee";
                e.preventDefault();
            });
        },
        createFileChunk(file, size = CHUNK_SIZE) {
            const chunks = [];
            let cur = 0;
            while (cur < this.file.size) {
                chunks.push({
                    index: cur,
                    file: this.file.slice(cur, cur + size)
                });
                cur += size;
            }
            return chunks;
        },
        async calculateHashWorker() {
            return new Promise(resolve => {
                this.worker = new Worker("/hash.js");
                this.worker.postMessage({ chunks: this.chunks });
                this.worker.onmessage = e => {
                    const { progress, hash } = e.data;
                    this.hashProgress = Number(progress.toFixed(2));
                    if (hash) {
                        resolve(hash);
                    }
                };
            });
        },
        calculateHashIdle() {
            return new Promise(res => {
                const spark = new sparkMD5.ArrayBuffer();
                let count = 0;

                const appendToSpark = async file => {
                    return new Promise(res => {
                        const reader = new FileReader();
                        reader.readAsArrayBuffer(file);
                        reader.onload = e => {
                            spark.append(e.target.result);
                            res();
                        };
                    });
                };
                const workLoop = async deadline => {
                    while (
                        count < this.chunks.length &&
                        deadline.timeRemaining() > 1
                    ) {
                        await appendToSpark(this.chunks[count++].file);
                        if (count < this.chunks.length) {
                            this.hashProgress = Number(
                                ((100 * count) / this.chunks.length).toFixed(2)
                            );
                        } else {
                            this.hashProgress = 100;
                            res(spark.end());
                        }
                    }
                    window.requestIdleCallback(workLoop);
                };
                window.requestIdleCallback(workLoop);
            });
        },
        async uploadFile() {
            //端点续传
            this.chunks = this.createFileChunk();
            console.log(this.chunks);
            // const hash = await this.calculateHashWorker();
            const hash = await this.calculateHashIdle();
            console.log("文件hash", hash);
            // let result = await this.isImage(this.file);
            // if (!result) {
            //     return;
            // }

            return;
            const form = new FormData();
            form.append("name", "file");
            form.append("file", this.file);
            const ret = await this.$http.post("upladfile", form, {
                onUploadProgress: progress => {
                    this.uploadProgess = Math.ceil(
                        (progress.loaded / progress.total) * 100
                    );
                }
            });
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

<style lang="stylus">
#drag
    height 200px
    width 200px
    border 2px dashed #eee
    text-align center
    vertical-align middle
    input[type='file']
        margin 80px auto
</style>
