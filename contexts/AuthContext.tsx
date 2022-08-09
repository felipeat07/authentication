import { createContext, ReactNode, useEffect, useState } from "react";
import { parseCookies, setCookie } from 'nookies'
import Router from 'next/router'
import { api } from "../services/api";

type User = {
    email: string;
    permissions: string[];
    roles: string[];
} | undefined;

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(cedentials: SignInCredentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}


export const AuthContext = createContext({} as AuthContextData)


export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user;

    useEffect(()=> {
        const { authToken } = parseCookies()
        if(authToken) {
            api.get('/me').then(response => { //Rota /me que contem tds as informações do usuário logaado
                
            const { email, permissions, roles } = response.data;
                
            setUser({
                    email,
                    permissions,
                    roles,
                })
            })
        }

    }, [])



    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password,
            })

            const { token, refreshToken, permissions, roles } = response.data;

            setCookie(undefined, 'authToken', token, {
                maxAge: 60*60*24*30, //expira em 30 dias
                path: '/', //todas as rotas tem acesso ao cookie
            })
            setCookie(undefined, 'authRefreshToken', refreshToken, {
                maxAge: 60*60*24*30, //expira em 30 dias
                path: '/', //todas as rotas tem acesso ao cookie
            })

            setUser({
                email,
                permissions,
                roles,
            })
    
            Router.push('/dashboard')

        } catch(err) {
            alert(err)
        }
    }


    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}

