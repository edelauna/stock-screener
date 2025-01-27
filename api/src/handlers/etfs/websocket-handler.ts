import { RequestMuxProperties } from "../../mux/request-mux";
import { CustomExecutionContext } from "../../utils/middleware";

type Ticker = {
  symbol: string,
  weight: string,
}

type EtfWsMessage = {
  etf_symbol: string,
  holdings: Ticker[]
}

const handleSession = async (websocket: WebSocket, env: Env, ctx: CustomExecutionContext) => {
  websocket.accept()
  websocket.addEventListener("message", async ({ data }) => {
    if(typeof data == 'string'){
      try {
        const {etf_symbol, holdings}: EtfWsMessage = JSON.parse(data)
        const stmt = env.DB.prepare(`INSERT INTO EtfWeighting (symbol, etf_symbol, weighting)
          VALUES (?, ?, ?)
          ON CONFLICT (symbol, etf_symbol) DO UPDATE SET
          weighting = excluded.weighting
          WHERE EtfWeighting.weighting != excluded.weighting`)
        const transaction = holdings.map(({symbol, weight}) => stmt.bind(symbol, etf_symbol, weight))

        const {results} = await env.DB.prepare(`SELECT symbol from EtfWeighting WHERE EtfWeighting.etf_symbol = ?`)
          .bind(etf_symbol).all<{symbol: string}>()
        const toDelete = results.filter(({symbol}) => holdings.find(h => h.symbol === symbol) === undefined)
        const delStmt = env.DB.prepare(`DELETE FROM EtfWeighting
          WHERE EtfWeighting.etf_symbol = ?
          AND symbol = ?`)
        
        toDelete.forEach(({symbol}) => transaction.push(delStmt.bind(etf_symbol, symbol)))
        
        await env.DB.batch(transaction)
        console.log(`Message received for ${etf_symbol}, with ${holdings.length} holdings!`)
      } catch (error) {
        console.log("ETFs:Websocket:handleSession:", error)
        websocket.send(JSON.stringify({ error: "Unknown message received", tz: new Date() }))
      }
    } else {
      console.log("ETFs:Websocket:handleSession:data was not a string:", data)
    }
  })

  websocket.addEventListener("close", async evt => {
    // Handle when a client closes the WebSocket connection
    console.log(evt)
  })
}

export const websocketHandler = async ({request, env, ctx}: RequestMuxProperties) => {
  const url = new URL(request.url);
  const etfKey = url.searchParams.get('etf_key')
  if(etfKey !== env.ETF_API_KEY) return new Response("Unauthorized", {status: 401})
  
  const upgradeHeader = request.headers.get("Upgrade")
  if (upgradeHeader !== "websocket") return new Response("Expected websocket", { status: 400 })

  const [client, server] = Object.values(new WebSocketPair())
  await handleSession(server, env, ctx)

  return new Response(null, {
    status: 101,
    webSocket: client
  })
}