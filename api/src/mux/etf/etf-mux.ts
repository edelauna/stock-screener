import { lookupHandler } from "../../handlers/etfs/lookup-handler";
import { websocketHandler } from "../../handlers/etfs/websocket-handler";
import { RequestMuxProperties } from "../request-mux";

export const etfMux = async ({ request, ...etc }: RequestMuxProperties): Promise<Response> => {
  const workerArgs = { request, ...etc }
  const url = new URL(request.url);
  const path = url.pathname.split('/')[2]
  switch (path) {
    case 'ws':
      return websocketHandler({ ...workerArgs })
    case 'lookup':
      return lookupHandler({ ...workerArgs })
    default:
      return new Response("Not found", {
        status: 404
      })
  }
}