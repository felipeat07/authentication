import axios, { AxiosError } from 'axios'
import  Router  from 'next/router';
import { destroyCookie, parseCookies, setCookie } from 'nookies'

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

export const api = axios.create({
    baseURL: 'http://localhost:3333',
})

api.interceptors.response.use(response => {
    return response
}, error => {
    if(error.response.status === 401){
        if(error.response.data?.code === 'token.expired') {
           let cookies = parseCookies()

           const { authRefreshToken } = cookies
           const originalConfig = error.config

           if(!isRefreshing){
            isRefreshing = true

            api.post('/refresh', {
                refreshToken: authRefreshToken
               }).then(response => {
                
                const { token } = response.data
               
                setCookie(undefined, 'authToken', token, {
                    maxAge: 60*60*24*30, //expira em 30 dias
                    path: '/', //todas as rotas tem acesso ao cookie
                })
                setCookie(undefined, 'authRefreshToken', response.data.refreshToken, {
                    maxAge: 60*60*24*30, //expira em 30 dias
                    path: '/', //todas as rotas tem acesso ao cookie
                })
    
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 

                failedRequestsQueue.forEach(request => request.onSuccess(token))
                failedRequestsQueue = []
    
               }).catch(err => {

                failedRequestsQueue.forEach(request => request.onFailure(err))
                failedRequestsQueue = []

               }).finally(()=> {
                isRefreshing = false
               })
           }

           return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers.common['Authorization'] = `Bearer ${token}`;

                        resolve(api(originalConfig))
                    },
                    onFailure: (err: AxiosError) => {
                        reject(err)
                    }
                })
           })


        } else {
            destroyCookie(undefined, 'authToken')
            destroyCookie(undefined, 'refreshAuthToken')

            Router.push('/')
        }
    }

    return Promise.reject(error);
})