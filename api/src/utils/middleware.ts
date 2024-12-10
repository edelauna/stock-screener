import { RequestMuxProperties } from "../mux/request-mux"
import { Customer } from "./billing"
import { CustomerCookie, verifyMessage } from "./cookies"
import { Payload, verify } from "./jwt"
import { refreshAccessToken } from "./tokens"

export type CustomExecutionContext = ExecutionContext & {
  newAccessToken?: string
  newRefreshToken?: string
  logout?: boolean
  user?: Payload
  customer?: Customer
}

type Cookies = {
  access_token?: string
  refresh_token?: string
  customer?: string
}

const isKeyOfCookies = (key: any): key is keyof Cookies => ['access_token', 'refresh_token', 'customer'].includes(key)

const parseCookies = (cookieString: string): Cookies => cookieString?.split('; ').reduce((prev: Cookies, curr: string) => {
  const [k, v] = curr.split('=')
  if (isKeyOfCookies(k)) prev[k] = v
  return prev
}, {})

const validateRefreshAccessToken = async (cookies: Cookies, env: Env, ctx: CustomExecutionContext) => {
  const jwt = cookies.access_token
  if (!jwt) return false
  const { isVerified, expired } = await verify(jwt, env, ctx)

  if (!isVerified) return false

  if (expired && cookies.refresh_token) refreshAccessToken(cookies.refresh_token, env, ctx)

  return true

}

const validateCustomer = async (cookies: Cookies, env: Env, ctx: CustomExecutionContext) => {
  const partialJwt = cookies.customer
  if (!partialJwt) return

  const { isValid, payload } = await verifyMessage<CustomerCookie>(partialJwt, env)
  if (isValid) {
    ctx.customer = payload.customer
  } else {
    ctx.customer = undefined
  }
}

export const reqAuthMiddleware = async ({ request, env, ctx }: RequestMuxProperties) => {
  const cookieStr = request.headers.get('Cookie')
  if (!cookieStr) return { request, env, ctx }

  const cookies = parseCookies(cookieStr)
  const valid = await validateRefreshAccessToken(cookies, env, ctx)
  if (!valid) {
    ctx.logout = true
  } else {
    await validateCustomer(cookies, env, ctx)
  }

  return { request, env, ctx }
}
