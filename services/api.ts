import axios from 'axios'
import { parseCookies } from 'nookies'

const { authToken } = parseCookies()

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${authToken}`
    }
})