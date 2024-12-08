import { signMessage } from "./cookies"
import { internalServerError } from "./errors"
import { verify } from "./jwt"
import { CustomExecutionContext } from "./middleware"

export type Customer = {
  id: string,
  object: 'customer',
  metadata: {
    oid?: string
  },
  subscriptions?: {
    data: {
      id: string
    }[]
  }
}

type CustomerSearchResult = {
  object: 'search_result',
  url: string,
  has_more: boolean,
  data: Customer[]
}

export const generateCustomerCookie = async (access_token: string, env: Env, ctx: CustomExecutionContext) => {
  const blankCookie = `customer=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
  let oid = ctx.user?.oid
  if (!oid) {
    // verify access token incase just logged in
    const { isVerified, expired } = await verify(access_token, env, ctx)

    if (expired || !isVerified) return blankCookie
    oid = ctx.user?.oid
  }

  if (!oid) return blankCookie

  const url = new URL('https://api.stripe.com/v1/customers/search');

  url.searchParams.append('query', `metadata['oid']:'${oid}'`);

  const response = await stripeFetchWrapper(url.toString(), env)
  if (!response.ok) throw internalServerError(`generateCustomerCookie response was not ok`, { ...response })

  const data = await response.json<CustomerSearchResult>()

  const customer = data.data.find(x => x.metadata.oid === oid)

  if (!customer) return blankCookie

  return `customer=${await signMessage({ oid, customer }, env)}; Path=/; HttpOnly; SameSite=Strict`

}

const stripeFetchWrapper = async (input: RequestInfo, env: Env, init?: RequestInit) => {
  try {
    return fetch(input, {
      ...init,
      headers: {
        ...init?.headers,
        'Authorization': `Basic ${btoa(env.STRIPE_API_KEY)}`
      },
      cf: {
        cacheTtlByStatus: {
          "200-299": 3600,
          404: 1,
          "500-599": 0
        }
      }
    })

  } catch (e) {
    throw internalServerError((e as Error).message)
  }
}
