import { useContext, useEffect, useRef, useState } from "react"
import { TIME_SERIES_DAILY_METADATA_STORE_NAME, TIME_SERIES_DAILY_STORE_NAME, TimeSeriesDailyRow } from "../../context/db/db";
import { store as symbolStore} from '../../context/symbol-search/symbol-search.provider';
import { useDb } from "../use-db";
import { formattedDateTime } from "../../utils/dateTime";

interface TimeSeriesDaily {
  [date: string]: TimeSeriesDayData
}

export interface TimeSeriesDayData{
  "1. open": string,
  "2. high": string,
  "3. low": string,
  "4. close": string,
  "5. volume": string
}
interface MetaData {
  symbol: string,
  "1. Information": string,
  "2. Symbol": string,
  "3. Last Refreshed": string,
  "4. Output Size": string,
  "5. Time Zone": string
}

interface Data {
  "Meta Data": MetaData,
  "Time Series (Daily)": TimeSeriesDaily,
}

const initialMetadata = {
  symbol: '',
  "1. Information": '',
  "2. Symbol": '',
  "3. Last Refreshed": '',
  "4. Output Size": '',
  "5. Time Zone": ''
}

export const useTimeSeriesDaily = () => {
  const [data, setData] = useState<TimeSeriesDailyRow[]>([]);
  const [metadata, setMetadata] = useState<Data["Meta Data"]>(initialMetadata);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchFromServer, setFetchFromServer] = useState(false)
  
  const {state: symbolState} = useContext(symbolStore)
  const {activeSymbol} = symbolState
  const ticker = activeSymbol["1. symbol"]
  const currentTickerRef = useRef('')
  const [fetchRef, setFetchRef] = useState(formattedDateTime(new Date(), 'UTC'))
  const currentFetchRef = useRef('')
  
  const {db, active} = useDb()
  
  useEffect(() => {
    const poll = () => setFetchRef(formattedDateTime(new Date(), 'UTC'))
    const intervalId = setInterval(poll, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(intervalId);
  });

  useEffect(() => {
    // will initially fetch on symbol change - then via polling intervals
    if(ticker !== currentTickerRef.current){
      currentTickerRef.current = ticker
      setFetchFromServer(true)
    } else if(fetchRef > currentFetchRef.current){
      setFetchFromServer(true)
      currentFetchRef.current = fetchRef
    }
  }, [ticker, fetchRef])

  useEffect(() => {
    const fetchData = async () => {
      const url = `${process.env.REACT_APP_API_URL}stocks?fn=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=full`
      
      try {
          setLoading(true)
          const response = await fetch(url);
          if (!response.ok) {
              setError('Network response was not ok');
              return
          }
          const result: Data = await response.json();

          if ("Time Series (Daily)" in result) {
            const rows: TimeSeriesDailyRow[] = []
            for(const date in result["Time Series (Daily)"]){
              rows.push({
                id: `${result["Meta Data"]["2. Symbol"]}-${date}`,
                date, 
                symbol: result["Meta Data"]["2. Symbol"],
                ...result["Time Series (Daily)"][date]
              })
            }
            setData(rows)
            result["Meta Data"]["3. Last Refreshed"] = fetchRef
            result["Meta Data"].symbol = result["Meta Data"]["2. Symbol"]
            setMetadata(result["Meta Data"])
          } else {
            setData([])
            setMetadata({
              ...initialMetadata,
              "3. Last Refreshed": fetchRef
            })
          }
          setError(null)
      } catch (err) {
          setError((err as Error).message);
      } finally {
          setLoading(false);
      }
    };
    //console.log(`fetchFromServer:${fetchFromServer}`)
    //console.log(`currentDataRef.current:${currentDataRef.current} = ${activeSymbol["1. symbol"]}-${currentRef}`)
    if(!loading && fetchFromServer){
      setFetchFromServer(false)
      if(ticker && (currentFetchRef.current === fetchRef || currentTickerRef.current === ticker)){
        fetchData();
      }
    }
  }, [fetchFromServer, ticker, fetchRef, loading]);

  useEffect(() => {
    const getData = (db:IDBDatabase, symbol: string ) => {
      
      const objectStores = db.transaction([TIME_SERIES_DAILY_STORE_NAME, TIME_SERIES_DAILY_METADATA_STORE_NAME], 'readonly')
    
      const dataStore = objectStores.objectStore(TIME_SERIES_DAILY_STORE_NAME)
      const dataIndex = dataStore.index('symbol')
      const dataGetRequest = dataIndex.getAll(symbol)
  
      const metadataStore = objectStores.objectStore(TIME_SERIES_DAILY_METADATA_STORE_NAME)
      const metadataGetRequest = metadataStore.get(symbol)

      objectStores.oncomplete = (_) => {
        if(metadataGetRequest.result) setMetadata(metadataGetRequest.result)
        if(dataGetRequest.result.length > 0) setData(dataGetRequest.result)
        setLoading(false)
      }
      objectStores.onerror = (ev) => {
        console.error("There was an error loading data from indexDB, event:")
        console.error(ev)
        setLoading(false)
      }
    }
    if(!active && db){
      setLoading(true)
      getData(db, ticker)
    }
  }, [active, db, ticker])

  useEffect(() => {
    if (!active && db && data.length > 0) {
      const objectStores = db.transaction([TIME_SERIES_DAILY_STORE_NAME], 'readwrite')

      const dataStore = objectStores.objectStore(TIME_SERIES_DAILY_STORE_NAME)
      data.forEach((value) => dataStore.put(value))
    }
  }, [db, active, data])

  useEffect(() => {
    if (!active && db) {
      const objectStores = db.transaction([TIME_SERIES_DAILY_METADATA_STORE_NAME], 'readwrite')

      const metadataStore = objectStores.objectStore(TIME_SERIES_DAILY_METADATA_STORE_NAME)
      metadataStore.put(metadata)
    }
  }, [db, active, metadata])

  return {
    data,
    metadata,
    loading,
    error
  }

}