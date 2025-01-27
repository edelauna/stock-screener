import { CustomerJwt, signMessage } from "./cookies"
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
      items: {
        data: {
          plan: {
            product: string
          }
        }[]
      }
    }[]
  }
}

type CustomerSearchResult = {
  object: 'search_result',
  url: string,
  has_more: boolean,
  data: Customer[]
}

export const planGuard = (productId: string, ctx: CustomExecutionContext) => {
  const foundPlanId = ctx.customer?.subscriptions?.data.find(s => s.items.data.find(i => i.plan.product === productId))
  return foundPlanId ? true : false
}

export const pluckCustomerFields = (customer: Customer) => ({
  id: customer.id,
  object: customer.object,
  metadata: {
    oid: customer.metadata.oid
  },
  subscriptions: {
    data: customer.subscriptions?.data.map(d => ({
      items: {
        data: d.items.data.map(di => ({
          plan: { product: di.plan.product },
        })),
      },
    })) ?? [],
  },
})

const blankCookie = `customer=; Path=/; Max-Age=0; SameSite=Strict`

export const generateCustomerJwt = async (env: Env, ctx: CustomExecutionContext) => {
  let oid = ctx.user?.oid

  if (!oid) return blankCookie

  const { customer } = ctx

  if (!customer) return blankCookie

  return await signMessage<CustomerJwt>({ oid, customer }, env)
}

export const generateCustomerJwtSafely = async (access_token: string, env: Env, ctx: CustomExecutionContext) => {
  let oid = ctx.user?.oid
  if (!oid) {
    // verify access token incase just logged in
    const { isVerified, expired } = await verify(access_token, env, ctx)

    if (expired || !isVerified) return blankCookie
    oid = ctx.user?.oid
  }
  const url = new URL('https://api.stripe.com/v1/customers/search');

  url.searchParams.append('query', `metadata['oid']:'${oid}'`);
  url.searchParams.append('expand[]', 'data.subscriptions')

  const response = await stripeFetchWrapper(url.toString(), env)
  if (!response.ok) throw internalServerError(`generateCustomerJwt response was not ok`, { ...response })

  const data = await response.json<CustomerSearchResult>()

  const customer = data.data.find(x => x.metadata.oid === oid)

  if (!customer) return blankCookie

  ctx.customer = pluckCustomerFields(customer)

  return await generateCustomerJwt(env, ctx)
}

export const stripeFetchWrapper = async (input: RequestInfo, env: Env, init?: RequestInit) => {
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
