import { RequestMuxProperties } from "../../mux/request-mux";

type InputBody = {
  id_token: string
}

export const logoutHandler = async ({ request, env, ctx }: RequestMuxProperties) => {
  const { id_token } = await request.json<InputBody>()
  const url = `${env.AZURE_AD_LOGOUT_URL}?id_token_hint=${id_token}&post_logout_redirect_uri=${env.AZURE_SPA_REDIRECT_URI}`
  const cookies = [
    `access_token=; Path=/; Max-Age=0; HttpOnly; Samesite=Strict`,
    `refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`,
    `customer=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`
  ];
  const response = new Response(JSON.stringify({ redirect_uri: url }), {
    status: 200,
  })
  cookies.forEach(c => response.headers.append('Set-Cookie', c))
  return response
}
