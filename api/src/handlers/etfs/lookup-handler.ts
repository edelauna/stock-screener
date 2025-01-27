import { RequestMuxProperties } from "../../mux/request-mux";

type DbRow = {
  symbol: string,
  etf_symbol: string,
  weighting: string,
}

export const lookupSymbolInEtf = (symbol: string, env: Env) => env.DB
.prepare(`SELECT symbol, etf_symbol, weighting FROM EtfWeighting
    WHERE EtfWeighting.symbol = ?`).bind(symbol.toUpperCase()).all()

export const lookupHandler = async ({request, env, ctx}: RequestMuxProperties) => {
  const url = new URL(request.url);
  const symbol = url.searchParams.get('symbol') ?? ""
  const { results } = await lookupSymbolInEtf(symbol, env)
  
  return Response.json(results)
}