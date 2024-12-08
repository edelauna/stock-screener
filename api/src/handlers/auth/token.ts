import { RequestMuxProperties } from "../../mux/request-mux";
import { generateCustomerCookie } from "../../utils/billing";
import { internalServerError } from "../../utils/errors";
import { ResponseBody, SCOPE } from "../../utils/tokens";

type InputBody = {
  code: string,
  verifier: {
    value: string,
    expiry: number
  }
}

export const tokenHandler = async ({ request, env, ctx }: RequestMuxProperties) => {
  try {
    const { code, verifier } = await request.json<InputBody>()
    const url = env.AZURE_AD_TOKEN_URL
    const body = new URLSearchParams()
    body.append('client_id', env.AZURE_SPA_CLIENT_ID)
    body.append('grant_type', 'authorization_code')
    body.append('scope', SCOPE)
    body.append('code', code)
    body.append('redirect_uri', env.AZURE_SPA_REDIRECT_URI)
    body.append('code_verifier', verifier.value)

    const result = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!result.ok) return internalServerError(await result.text(), { status: result.status, statusTest: result.statusText })

    const { access_token, id_token, refresh_token } = await result.json<ResponseBody>()

    const customerCookie = await generateCustomerCookie(access_token, env, ctx)

    const cookies = [
      `access_token=${access_token}; Path=/; HttpOnly; Samesite=Strict`,
      `refresh_token=${refresh_token}; Path=/; HttpOnly; SameSite=Strict`,
      customerCookie
    ];
    const response = new Response(JSON.stringify({ id_token }), { status: 200 })
    cookies.forEach(c => response.headers.append('Set-Cookie', c))
    return response
  } catch (e) {
    return internalServerError((e as Error).message)
  }
}
