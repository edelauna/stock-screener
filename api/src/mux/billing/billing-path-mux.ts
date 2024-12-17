import { handleMange, handleRedirected, handleUpdate } from "../../handlers/billing/billing-handler";
import { RequestMuxProperties } from "../request-mux";

export const billingMux = async ({ request, ...etc }: RequestMuxProperties) => {
  const url = new URL(request.url)
  const path = url.pathname.split('/')[2]
  switch (path) {
    case 'manage':
      return handleMange({ request, ...etc })
    case 'redirected':
      return handleRedirected({ request, ...etc })
    case 'refresh':
      return handleUpdate({ request, ...etc })
    default:
      return new Response("Not found", {
        status: 404
      })
  }
}
