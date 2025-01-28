import { useContext, useEffect, useRef, useState } from "react"
import { ETF_HOLDINGS_STORE_NAME } from "../../context/db/db";
import { store as symbolStore} from '../../context/symbol-search/symbol-search.provider';
import { useDb } from "../use-db";
import { errorStore } from "../../context/errors/errors.provider";
import { Add } from "../../context/errors/errors.actions";

type DbRow = {
  symbol: string,
  etf_symbol: string,
  weighting: string,
}

export const useEtfHoldings = () => {
  const [data, setData] = useState<DbRow[]>([]);
  const [loading, setLoading] = useState(false);
  const {dispatch} = useContext(errorStore)
  const [fetchFromServer, setFetchFromServer] = useState(false)

  const {state: symbolState} = useContext(symbolStore)
  const {activeSymbol} = symbolState
  const ticker = activeSymbol["1. symbol"]
  const currentTickerRef = useRef('')

  const {db, active} = useDb()

  useEffect(() => {
    if(ticker !== currentTickerRef.current){
      currentTickerRef.current = ticker
      setFetchFromServer(true)
    } 
  }, [ticker])

  useEffect(() => {
    const fetchData = async () => {
      const url = `${process.env.REACT_APP_API_URL}etf/lookup?symbol=${ticker}`

      try {
          setLoading(true)
          const response = await fetch(url, {
            credentials: 'include'
          });
          if (!response.ok) {
              dispatch(Add({
                header: "useEtfHoldings::fetchData: network resposne was not ok",
                body: await response.text()
              }))
            return
          }
          const result: DbRow[] = await response.json();

          setData(result)
      } catch (err) {
        dispatch(Add({
          header: "useEtfHoldings::fetchData: had an error",
          body: (err as Error).message
        }))
      } finally {
          setLoading(false);
      }
    };
    if(!loading && fetchFromServer){
      setFetchFromServer(false)
      if(ticker && currentTickerRef.current === ticker){
        fetchData();
      }
    }
  }, [fetchFromServer, ticker, loading, dispatch]);

  useEffect(() => {
    const getData = (db:IDBDatabase, symbol: string ) => {

      const objectStores = db.transaction([ETF_HOLDINGS_STORE_NAME], 'readonly')

      const dataStore = objectStores.objectStore(ETF_HOLDINGS_STORE_NAME)
      const dataIndex = dataStore.index('symbol')
      const dataGetRequest = dataIndex.getAll(symbol)

      objectStores.oncomplete = (_) => {
        if(dataGetRequest.result.length > 0) setData(dataGetRequest.result)
        setLoading(false)
      }
      objectStores.onerror = (ev) => {
        dispatch(Add({
          header: "useEtfHoldings::There was an error loading data from indexDB, event:",
          body: JSON.stringify(ev)
        }))
        setLoading(false)
      }
    }
    if(!active && db){
      setLoading(true)
      getData(db, ticker)
    }
  }, [active, db, ticker, dispatch])

  useEffect(() => {
    if (!active && db && data.length > 0) {
      const objectStores = db.transaction([ETF_HOLDINGS_STORE_NAME], 'readwrite')

      const dataStore = objectStores.objectStore(ETF_HOLDINGS_STORE_NAME)
      data.forEach((value) => dataStore.put({
        id: `${value.symbol}-${value.etf_symbol}`,
        ...value
      }))

      objectStores.onerror = (ev) => dispatch(Add({
        header: "useEtfHoldings::There was an error saving data into indexDB",
        body: JSON.stringify(ev)
      }))
    }
  }, [db, active, data, dispatch])

  return {
    data,
    loading
  }

}
