import { RequestMuxProperties } from "../../mux/request-mux";
import { Customer, generateCustomerJwt, pluckCustomerFields, stripeFetchWrapper } from "../../utils/billing";
import { internalServerError } from "../../utils/errors";

type PortalSession = {
  url: string
}

type CheckoutResponse = {
  customer: Customer
}

export const handleMange = async ({ ctx, env }: RequestMuxProperties) => {
  const { customer } = ctx
  if (customer) {
    const stripeUrl = 'https://api.stripe.com/v1/billing_portal/sessions'
    const body = new URLSearchParams({ return_url: `${env.ALLOWED_ORIGIN}/managed_redirected` })
    body.append('customer', customer.id)
    const response = await stripeFetchWrapper(stripeUrl, env, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    if (!response.ok) return internalServerError('Response not ok', { ...response, body: await response.text() })
    const { url } = await response.json<PortalSession>()
    return Response.json({ url })
  }
  return new Response('Bad data', { status: 400 })
}

export const handleRedirected = async ({ request, ctx, env }: RequestMuxProperties) => {
  const checkoutSessionId = new URL(request.url).searchParams.get('checkout_session_id')
  if (!checkoutSessionId) return internalServerError('missing checkoutSessionId')

  const { oid } = ctx.user ?? {}
  if (!oid) return internalServerError('no oid found for user')

  const body = new URLSearchParams({ 'expand[]': 'customer' })
  body.append('expand[]', 'customer.subscriptions')
  const checkoutResponse = await stripeFetchWrapper(`https://api.stripe.com/v1/checkout/sessions/${checkoutSessionId}`, env, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })
  if (!checkoutResponse.ok) return internalServerError('checkoutResponse was not ok', { text: await checkoutResponse.text() })

  const { customer } = await checkoutResponse.json<CheckoutResponse>()

  ctx.customer = pluckCustomerFields(customer)

  const updateCustomerPromise = stripeFetchWrapper(`https://api.stripe.com/v1/customers/${customer.id}`, env, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({ 'metadata[oid]': oid })
  })
  ctx.waitUntil(updateCustomerPromise)

  const customerJwt = await generateCustomerJwt(env, ctx)
  return new Response(JSON.stringify({ customer_token: customerJwt }), {
    status: 200, headers: {
      'Set-Cookie': `customer=${customerJwt}; Path=/; HttpOnly; SameSite=Strict`
    }
  })
}

export const handleUpdate = async ({ request, ctx, env }: RequestMuxProperties) => {
  const { id } = ctx.customer ?? {}
  if (!id) return internalServerError('no customer_id found.', null, {
    message: "Customer Id not provided"
  }, 403)

  const query = new URLSearchParams({ 'expand[]': 'subscriptions' })
  const customerResponse = await stripeFetchWrapper(`https://api.stripe.com/v1/customers/${id}?${query}`, env)
  if (!customerResponse.ok) return internalServerError('customerResponse was not ok', { text: await customerResponse.text() })

  const customer = await customerResponse.json<Customer>()

  ctx.customer = pluckCustomerFields(customer)

  const customerJwt = await generateCustomerJwt(env, ctx)
  return new Response(JSON.stringify({ customer_token: customerJwt }), {
    status: 200, headers: {
      'Set-Cookie': `customer=${customerJwt}; Path=/; HttpOnly; SameSite=Strict`
    }
  })
}
