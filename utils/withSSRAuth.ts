import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/error/AuthTokenError";


export function withSSRAuth(fn: GetServerSideProps) {
  return async (ctx: GetServerSidePropsContext)=> {
    const cookies = parseCookies(ctx)

    if (!cookies['authToken']) {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      }
    }
    try {
      return await fn(ctx)
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'authToken')
        destroyCookie(ctx, 'authRefreshToken')

        return {
          redirect: {
            destination: '/',
            permanent: false,
          }
        }
      }
    }
  }
}