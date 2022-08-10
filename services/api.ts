import axios from 'axios'
import { parseCookies, setCookie } from 'nookies'

let { authToken } = parseCookies()

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${authToken}`
    }
})

api.interceptors.response.use(response => {
    return response
}, error => {
    if(error.response.status === 401){
        if(error.response.data?.code === 'token.expired') {
           let cookies = parseCookies()

           const { authRefreshToken } = cookies

           api.post('/refresh', {
            authRefreshToken
           }).then(response => {
            
            const { authToken } = response.data
           
            setCookie(undefined, 'authToken', authToken, {
                maxAge: 60*60*24*30, //expira em 30 dias
                path: '/', //todas as rotas tem acesso ao cookie
            })
            setCookie(undefined, 'authRefreshToken', response.data.authRefreshToken, {
                maxAge: 60*60*24*30, //expira em 30 dias
                path: '/', //todas as rotas tem acesso ao cookie
            })


           })


        } else {
            //deslogar usuário
        }
    }
})