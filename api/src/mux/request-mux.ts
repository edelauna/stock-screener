import { CustomExecutionContext } from "../utils/middleware";
import { authPathMux } from "./auth/auth-path-mux";
import { pathMux } from "./stocks/path-mux";

export type RequestMuxProperties = {
  request: Request;
  env: Env;
  ctx: CustomExecutionContext
}
export const requestMux = async ({ request, ...etc }: RequestMuxProperties): Promise<Response> => {
  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  switch (paths[1]) {
    case 'stocks':
      return pathMux({ request, ...etc })
    case 'auth':
      return authPathMux({ request, ...etc })
    default:
      return new Response("Not found", {
        status: 404
      })
  }
}
