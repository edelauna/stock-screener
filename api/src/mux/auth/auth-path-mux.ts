import { logoutHandler } from "../../handlers/auth/logout";
import { tokenHandler } from "../../handlers/auth/token";
import { RequestMuxProperties } from "../request-mux";

export const authPathMux = async ({ request, ...etc }: RequestMuxProperties): Promise<Response> => {
  switch (request.method) {
    case 'OPTIONS':
      return new Response(null, { status: 204 })
    case 'POST':
      const url = new URL(request.url)
      const path = url.pathname.split('/')[2]
      switch (path) {
        case 'token':
          return tokenHandler({ request, ...etc })
        case 'logout':
          return logoutHandler({ request, ...etc })
        default:
          return new Response("Not found", {
            status: 404
          })
      }
    default:
      return new Response("Method not allowed", {
        status: 405
      })
  }
}
