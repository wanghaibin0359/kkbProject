import Vue from "vue";
import axios from "axios";
import { MessageBox } from 'element-ui'

const service = axios.create({
    baseURL: "/api"
})
export default ({ store, redirect }) => {
    service.interceptors.request.use(async config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.common['Authorization'] = 'Bearer ' + token
        }
        return config
    })
    service.interceptors.response.use(async res => {
        let { data } = res
        if (data.code == -666) {
            MessageBox.confirm('登录已过期', '过期' ,{
                confirmButtonText: "登录",
                showCancelButton: false,
                type: "warning"
            }).then(() => {
                localStorage.removeItem('token')
                redirect({ path: '/login' })
            })
        }
        return data
    })
}


Vue.prototype.$http = service
export const http = service
