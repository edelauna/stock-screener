import { useContext, useEffect, useRef, useState } from "react"
import { store } from "../context/symbol-search/symbol-search.provider";
import { Refresh, UpdateCurrentDataRef } from "../context/symbol-search/symbol-search.actions";
import { useDb } from "./use-db";
import { SYMBOL_SEARCH_STORE_NAME } from "../context/db/db";

export interface SymbolSearchResult {
  "1. symbol": string,
  "2. name": string,
  "3. type": string,
  "4. region": string,
  "5. marketOpen": string,
  "6. marketClose": string,
  "7. timezone": string,
  "8. currency": string,
  "9. matchScore": string
}

export const useSymbolSearch = (input: string) => {
  const {state, dispatch} = useContext(store)
  const [data, setData] = useState<SymbolSearchResult[]>(state.bestMatches);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchFromServer, setFetchFromServer] = useState(false)
  const {db, active} = useDb()
  const currentInputRef = useRef('')
  const currentDataRef = useRef('')
  
  useEffect(() =>{
    if(state.currentDataRef === currentInputRef.current) 
      setData(state.bestMatches)
    }, [state.bestMatches, state.currentDataRef])

  useEffect(() => {
    const getData = (db:IDBDatabase, key: string ) => {
      const objectStores = db.transaction([SYMBOL_SEARCH_STORE_NAME], 'readonly')
    
      const dataStore = objectStores.objectStore(SYMBOL_SEARCH_STORE_NAME)
      const dataGetRequest = dataStore.get(key)
      dataGetRequest.onsuccess = (_) => {
        if(dataGetRequest.result) {
          dispatch(Refresh(dataGetRequest.result.bestMatches))
          dispatch(UpdateCurrentDataRef(key))
        } else {
          setFetchFromServer(true)
          currentDataRef.current = key
        }
        currentInputRef.current = key
      }
      objectStores.oncomplete = (_) => setLoading(false)
      objectStores.onerror = (ev) => {
        setError("There was an error loading data from indexDB")
        console.error("There was an error loading data from indexDB, event:")
        console.error(ev)
        setLoading(false)
      }
    }

    if(active) return 
    if(db && !loading && currentInputRef.current !== input) {
      setLoading(true)
      getData(db, input)
    }
  }, [db, loading, active, input, dispatch])
  

  useEffect(() => {
      const fetchData = async () => {
          // Use the environment variable
          const url = `${process.env.REACT_APP_API_URL}stocks?fn=SYMBOL_SEARCH&keywords=${input}`
          
          try {
              setLoading(true)
              const response = await fetch(url);
              if (!response.ok) {
                  setError('Network response was not ok');
              }
              const result = await response.json();
              if ('bestMatches' in result) {
                dispatch(Refresh(result.bestMatches))
              } else {
                dispatch(Refresh([]))
              }
              setError(null)
              dispatch(UpdateCurrentDataRef(input))
          } catch (err) {
              setError((err as Error).message);
          } finally {
              setLoading(false);
          }
      };
      if(!loading && fetchFromServer){ 
        setFetchFromServer(false)
        if(currentDataRef.current === input){
          fetchData();
        }
      }
  }, [input, dispatch, fetchFromServer, loading]);

  return {
    data,
    loading,
    error
  }

}