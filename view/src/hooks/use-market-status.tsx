import { useContext, useEffect, useState } from "react"
import { Data, store } from "../context/market-status/market-status.provider";
import { Refresh } from "../context/market-status/market-status.actions";
import { errorStore } from "../context/errors/errors.provider";
import { Add } from "../context/errors/errors.actions";


export const useMarketStatus = () => {
  const {state, dispatch} = useContext(store)
  const {dispatch: errorDispatch} = useContext(errorStore)
  const [data, setData] = useState<Data["markets"]>(state.markets);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState(new Date().toUTCString())
  const [fetchFromServer, setFetchFromServer] = useState(false)

  useEffect(() => setData(state.markets), [state.markets])

  useEffect(() => {
    if(!state.initializing && !loading && input > state.currentRef){
      setFetchFromServer(true)
    } else {
      setFetchFromServer(false)
    }
  },[state.currentRef, state.initializing, loading, input])

  useEffect(() => {
    const poll = () => {
      setInput(i => {
        const newDate = new Date(i)
        newDate.setMinutes(newDate.getMinutes() + 15)
        return newDate.toUTCString()
      })
    }

    const intervalId = setInterval(poll, 15 * 60 * 1000); // 15 minutes 15 * 60 * 1000

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
      const fetchData = async () => {
          // Use the environment variable
          const url = `${process.env.REACT_APP_API_URL}stocks?fn=MARKET_STATUS`

          try {
              if(loading) return
              setLoading(true)
              const response = await fetch(url);
              if (!response.ok) return errorDispatch(Add({
                    header: 'Network response was not ok',
                    body: await response.text()
                  }));
              const result = await response.json();
              if ('endpoint' in result && result.endpoint === "Global Market Open & Close Status") {
                dispatch(Refresh({markets: result.markets, currentRef: input}));
              } else {
                dispatch(Refresh({markets: [], currentRef: input}));
              }
          } catch (err) {
            errorDispatch(Add({
              header: 'Error in useMarketStatus hook',
              body: (err as Error).message
            }))
          } finally {
              setLoading(false);
          }
      };
      if(fetchFromServer){
        setFetchFromServer(false)
        fetchData();
      }
  }, [fetchFromServer, loading, state, dispatch, input, errorDispatch]);

  return {
    data,
    loading,
  }

}
