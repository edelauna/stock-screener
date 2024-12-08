import { internalServerError } from "./errors";
import { CustomExecutionContext } from "./middleware";

export type ResponseBody = {
  access_token: string,
  id_token: string,
  token_type: string,
  not_before: number,
  expires_in: number,
  resource: string,
  id_token_expires_in: number,
  profile_info: string,
  scope: string,
  refresh_token: string,
  refresh_token_expires_in: number
}

export const SCOPE = 'offline_access openid https://lokeel.onmicrosoft.com/simple-screener-api/Username.Read'

export const refreshAccessToken = async (refresToken: string, env: Env, ctx: CustomExecutionContext) => {
  const url = env.AZURE_AD_TOKEN_URL
  const body = new URLSearchParams()
  body.append('client_id', env.AZURE_SPA_CLIENT_ID)
  body.append('grant_type', 'refresh_token')
  body.append('scope', SCOPE)
  body.append('refresh_token', refresToken)

  const result = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!result.ok) throw internalServerError(await result.text(), { status: result.status, statusTest: result.statusText })
  // todo should recursively verify this signature
  const { access_token, refresh_token } = await result.json<ResponseBody>()
  ctx.newAccessToken = access_token
  ctx.newRefreshToken = refresh_token
}
