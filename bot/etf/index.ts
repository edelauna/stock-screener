import { exit } from 'process';
import {get} from 'request';
import { StringStream } from 'scramjet';

export type CsvRow = {
  symbol: string,
  name: string,
  exchange: string,
  assetType: string,
  ipoDate: string,
  delistingDate: string,
  status: string
}

type Ticker = {
  symbol: string,
  weight: string,
}

export type EtfProfile = {
  net_assets: string,
  net_expense_ratio: string,
  portfolio_turnover: string,
  dividend_yield: string,
  inception_date: string,
  leveraged: string,
  holdings: Ticker[]
}

const rowsProcess = new Set();

let ws: WebSocket;

let DONE = false;
let retries = 0

export async function processRow(listing: CsvRow, ttl = 0) {
  if (listing.assetType === 'ETF' && listing.status === "Active") {
    const symbol = listing.symbol;
    if(rowsProcess.has(symbol)) return;
    console.log(`Processing ETF: ${symbol}`);
    let etfProfile: EtfProfile;
    try {
      // Step 4: Fetch ETF profile
      etfProfile = await fetchETFProfile(symbol);
      console.log('etfProfile', etfProfile)
      // seems to be often enough that api returns an empty object
      if(Object.keys(etfProfile).length === 0) return
      // Step 5: Send message to WebSocket
      if (etfProfile.holdings.length > 0) {
        const message = JSON.stringify({
          etf_symbol: symbol,
          holdings: etfProfile.holdings
        });
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
          rowsProcess.add(symbol);
          console.log(`Sent data for ${symbol}`);
        } else {
          throw new Error("WebSocket not available")
        }
      } else {
        console.error(`No holdings for ${symbol}, resonse was: `, etfProfile);
        //throw new Error()
      }
    } catch (e) {
      // swallow any update errors - try another 2 times in case of rate-limiting
      if(ttl < 7) {
        console.error(`processRow:caught:error for ${symbol}:`, etfProfile, e)
        return new Promise<void>((resolve) => setTimeout(async() => {
          await processRow(listing, ++ttl)
          resolve()
        }, 1000 * (5 + ( 10 * ttl)))) // max 25 second backoff
      }
    }
  }
}
// Function to fetch and parse CSV data
async function fetchAndParseCSV(url: string): Promise<void> {
  await get(url)
      .pipe(new StringStream())
      .CSVParse({header: true, delimiter: ','})  // parse CSV output into row objects
      .map(async (row: CsvRow) => {
        await processRow(row)
      })
      .run()
    DONE = true
    ws.close()
}
// Function to fetch ETF profile
export async function fetchETFProfile(symbol: string): Promise<EtfProfile> {
  const url = `https://www.alphavantage.co/query?function=ETF_PROFILE&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Main function
const timeoutIds = [];
function main() {
  //return new Promise<void>((resolve, reject) => {
  // Check if API key is set in environment variables
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    console.error('ALPHAVANTAGE_API_KEY environment variable is not set');
    return;
  }

  const websocktUrl = process.env.WEBSOCKET_URL;
  if (!websocktUrl) {
    console.error('WEBSOCKET_URL environment variable is not set');
    return;
  }

  // Step 1: Open a WebSocket connection
  const _ws = new WebSocket(websocktUrl);

  _ws.onopen = async () => {
    console.log('WebSocket connection established');
    while(timeoutIds.length > 0){
      clearTimeout(timeoutIds.pop()) 
    }
    const prevWs = ws
    ws = _ws
    if(!prevWs){
      // Step 2: Fetch CSV file
      const csvUrl = `https://www.alphavantage.co/query?function=LISTING_STATUS&apikey=${apiKey}`;
      await fetchAndParseCSV(csvUrl);
    }
  };

  _ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    // try to reconnect
    if(!DONE && retries++ < 7) timeoutIds.push(setTimeout(() => main(), 1000 * 5))
    else exit(2)
  };

  _ws.onclose = () => {
    console.log('WebSocket connection closed');
    if(!DONE && retries++ < 7) timeoutIds.push(setTimeout(() => main(), 1000 * 5))
    else(3)
  };
//})
}

// Run the main function
main()
