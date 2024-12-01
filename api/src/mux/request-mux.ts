import { pathMux } from "./stocks/path-mux";

export type RequestMuxProperties = {
    request: Request; 
    env: Env ; 
    ctx: ExecutionContext
}
export const requestMux = async ({request, ...etc}: RequestMuxProperties): Promise<Response> => {
  const url = new URL(request.url);
  const paths = url.pathname.split('/');
  switch(paths[1]) {
    case 
    'stocks':
      return pathMux({request, ...etc})
    default:
      return new Response("Not found", {
        status: 404
      })
  }
}