<template>
    <div>
        {{uploadProgess}}
        <h1>用户中心</h1>
        <div>
            <div ref="drag" id="drag">
                <input type="file" name="file" @change="handleFilerChange" />
            </div>
        </div>
        <div style="width:200px;">
            <!-- <el-progress :percentage="uploadProgess" :text-inside="true" :stroke-width="20"></el-progress> -->
        </div>
        <el-button @click="uploadFile">上传文件</el-button>

        <div style="width:200px;">
            <p>计算hash进度</p>
            <el-progress :percentage="hashProgress" :text-inside="true" :stroke-width="20"></el-progress>
        </div>
        <div>
            <div class="cube-container" :style="{width:cubeWidth+'px'}">
                <div class="cube" v-for="chunk in chunks" :key="chunk.name">
                    <div
                        :class="{'uploading':chunk.progress>0 && chunk.progress<100,
                    'success':chunk.progress==100,'error':chunk.progress<0}"
                        :style="{height:chunk.progress+'%'}"
                    >
                        <i
                            class="el-icon-loading"
                            style="color:#f56c6c"
                            v-if="chunk.progress<100&& chunk.progress>0"
                        ></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import sparkMD5 from "spark-md5";
const CHUNK_SIZE = 1 * 1024 * 1024;
export default {
    async mounted() {
        const ret = await this.$http.get("user/info");
        this.bindEvents();
    },
    data() {
        return {
            file: null,
            // uploadProgess: 50,
            hashProgress: 0,
            chunks: []
        };
    },
    computed: {
        cubeWidth() {
            return Math.ceil(Math.sqrt(this.chunks.length)) * 16;
        },
        uploadProgess() {
            if (!this.file || !this.chunks.length) {
                return 0;
            }
            const loaded = this.chunks
                .map(item => {
                    return item.progress * item.size;
                })
                .reduce((acc, cur) => acc + cur, 0);
            return Number(((loaded * 100) / this.file.size).toFixed(2));
        }
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
        async claculateHashSample() {
            return new Promise(res => {
                const spark = new sparkMD5.ArrayBuffer();
                const reader = new FileReader();

                const file = this.file;
                const size = file.size;
                const offset = 2 * 1024 * 1024;

                let chunks = [file.slice(0, offset)];

                let cur = offset;
                while (cur < size) {
                    if (cur + offset >= size) {
                        chunks.push(file.slice(cur, cur + offset));
                    } else {
                        // 中间区块
                        const mid = cur + offset / 2;
                        const end = cur + offset;
                        chunks.push(file.slice(cur, cur + 2));
                        chunks.push(file.slice(mid, mid + 2));
                        chunks.push(file.slice(end - 2, end));
                    }
                    cur += offset;
                }
                reader.readAsArrayBuffer(new Blob(chunks));
                reader.onload = e => {
                    spark.append(e.target.result);
                    this.hashProgress = 100;
                    res(spark.end());
                };
            });
        },
        async uploadFile() {
            //端点续传
            const chunks = this.createFileChunk();
            //  console.log(this.chunks);
            // const hash = await this.calculateHashWorker();
            // const hash1 = await this.calculateHashIdle();
            const hash = await this.claculateHashSample();
            this.hash = hash;
            // console.log("文件hash", hash);
            // console.log("文件hash", hash1);
            // console.log("文件hash", hash2);
            // let result = await this.isImage(this.file);
            // if (!result) {
            //     return;
            // }

            const {
                data: { uploaded, uploadedList }
            } = await this.$http.post("/checkfile", {
                hash: this.hash,
                ext: this.file.name.split(".").pop()
            });
            if (uploaded) {
                //秒传
                return this.$message.success("秒传成功");
            }
            this.chunks = chunks.map((chunk, index) => {
                const name = hash + "-" + index;
                return {
                    hash,
                    name,
                    index,
                    chunk: chunk.file,
                    progress: uploadedList.indexOf(name) > -1 ? 100 : 0
                };
            });
            console.log(this.chunks);
            await this.uploadChunks();
            await this.mergeRequest();
            return;
            const form = new FormData();
            form.append("name", "file");
            form.append("file", this.file);
            const ret = await this.$http.post("uploadfile", form, {
                onUploadProgress: progress => {
                    this.uploadProgess = Math.ceil(
                        (progress.loaded / progress.total) * 100
                    );
                }
            });
            console.log(ret);
        },
        async mergeRequest() {
            await this.$http.post("merge", {
                ext: this.file.name.split(".").pop(),
                size: CHUNK_SIZE,
                hash: this.hash
            });
        },
        async uploadChunks() {
            const requests = this.chunks
                .filter(chunk => chunk.progress != 100)
                .map((chunk, index) => {
                    const form = new FormData();
                    form.append("chunk", chunk.chunk);
                    form.append("hash", chunk.hash);
                    form.append("name", chunk.name);
                    return form;
                })
                .map(form => {
                    return this.$http.post("/uploadfile", form, {
                        onUploadProgress: progress => {
                            let index = form
                                .get("name")
                                .split("-")
                                .pop();
                            this.chunks[index].progress = Math.ceil(
                                (progress.loaded / progress.total) * 100
                            );
                        }
                    });
                });
            console.log(requests);
            await Promise.all(requests);
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
.cube-container
    .cube
        width 14px
        height 14px
        line-height 12px
        border 1px black solid
        background #eee
        float left
        >.success
            background green
        >.uploading
            background blue
        >.error
            background red
</style>
