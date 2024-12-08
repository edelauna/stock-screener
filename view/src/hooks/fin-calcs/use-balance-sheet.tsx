import { useEffect, useRef, useState } from "react"
import { useDb } from "../use-db"
import { formattedDateTime } from "../../utils/dateTime"
import { BALANCE_SHEET_STORE_NAME } from "../../context/db/db"

interface BalannceSheetReport extends BalannceSheetReportRaw {
  typeOfReport: 'annual' | 'quarterly', //computed
}

interface BalannceSheetReportRaw {
  fiscalDateEnding: string,
  reportedCurrency: string,
  totalAssets: string,
  totalCurrentAssets: string,
  cashAndCashEquivalentsAtCarryingValue: string,
  cashAndShortTermInvestments: string,
  inventory: string,
  currentNetReceivables: string,
  totalNonCurrentAssets: string,
  propertyPlantEquipment: string,
  accumulatedDepreciationAmortizationPPE: string,
  intangibleAssets: string,
  intangibleAssetsExcludingGoodwill: string,
  goodwill: string,
  investments: string,
  longTermInvestments: string,
  shortTermInvestments: string,
  otherCurrentAssets: string,
  otherNonCurrentAssets: string,
  totalLiabilities: string,
  totalCurrentLiabilities: string,
  currentAccountsPayable: string,
  deferredRevenue: string,
  currentDebt: string,
  shortTermDebt: string,
  totalNonCurrentLiabilities: string,
  capitalLeaseObligations: string,
  longTermDebt: string,
  currentLongTermDebt: string,
  longTermDebtNoncurrent: string,
  shortLongTermDebtTotal: string,
  otherCurrentLiabilities: string,
  otherNonCurrentLiabilities: string,
  totalShareholderEquity: string,
  treasuryStock: string,
  retainedEarnings: string,
  commonStock: string,
  commonStockSharesOutstanding: string
}

interface BalannceSheetReportData {
  symbol: string,
  reports: BalannceSheetReport[]
}

interface BalannceSheetReportRawData {
  symbol: string,
  annualReports: BalannceSheetReportRaw[],
  quarterlyReports: BalannceSheetReportRaw[],
}

const initialData: BalannceSheetReportData = {
  symbol: '',
  reports: []
}

export interface BalanceSheetState {
  data: BalannceSheetReportData,
  loading: boolean,
  error: string,
}

export const useBalanaceSheet = (symbol: string): BalanceSheetState => {
  const {db, active: dbActive} = useDb()
  const [fetchFromServer, setFetchFromServer] = useState(false)
  const [fetchRef, setFetchRef] = useState(formattedDateTime(new Date(), 'UTC'))
  const currentFetchRef = useRef(fetchRef)
  const currentSymbolRef = useRef('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState('')

  useEffect(() => {
    const poll = () => setFetchRef(formattedDateTime(new Date(), 'UTC'))
    const intervalId = setInterval(poll, 2 * 60 * 60 * 1000); // 2 hours

    return () => clearInterval(intervalId);
  });

  useEffect(() => {
    // will initially fetch on symbol change - then via polling intervals
    if(symbol !== currentSymbolRef.current){
      currentSymbolRef.current = symbol
      setFetchFromServer(true)
    } else if(fetchRef > currentFetchRef.current){
      setFetchFromServer(true)
      currentFetchRef.current = fetchRef
    }
  }, [symbol, fetchRef])

  useEffect(() => {
    const fetchData = async () => {
      const url = `${process.env.REACT_APP_API_URL}stocks?fn=BALANCE_SHEET&symbol=${symbol}`
      try {
        setLoading(true)
        const response = await fetch(url , {credentials: 'include'})
        if(!response.ok){
          setError('Response was not ok.')
          return
        }
        const result: BalannceSheetReportRawData = await response.json()
        const reports: BalannceSheetReport[] = []
        result.annualReports.forEach(r => reports.push({
          ...r,
          typeOfReport: 'annual',
        }))
        result.quarterlyReports.forEach(r => reports.push({
          ...r,
          typeOfReport: 'quarterly',
        }))
        setData({
          symbol,
          reports: reports.sort((a,b) => (new Date(b.fiscalDateEnding).getTime() - new Date(a.fiscalDateEnding).getTime())) // return sorted by fiscdateEnding
        })
      } catch(err) {
        setError((err as Error).message);
      } finally {
        setLoading(false)
      }
    }
    //console.log(`!loading:${!loading} && fetchFromServer:${fetchFromServer}`)
    if(!loading && fetchFromServer){
      setFetchFromServer(false)
      //console.log(`currentFetchRef.current:${currentFetchRef.current} === fetchRef:${fetchRef} || currentSymbolRef.current:${currentSymbolRef.current} === symbol:${symbol}`)
      if(currentFetchRef.current === fetchRef || currentSymbolRef.current === symbol)
        fetchData()
    }
  }, [loading, fetchFromServer, fetchRef, symbol])

  useEffect(() => {
    const getData = (db:IDBDatabase) => {
      const objectStores = db.transaction([BALANCE_SHEET_STORE_NAME], 'readonly')

      const dataStore = objectStores.objectStore(BALANCE_SHEET_STORE_NAME)
      const dataGetRequest = dataStore.get(symbol)

      objectStores.oncomplete = (_) => {
        if(dataGetRequest.result){
          setData(dataGetRequest.result)
        }
        setLoading(false)
      }
      objectStores.onerror = (ev) => {
        console.error("There was an error loading data from indexDB, event:")
        console.error(ev)
        setLoading(false)
      }
    }
    if(!dbActive && db){
      setLoading(true)
      getData(db)
    }
  }, [dbActive, db, symbol])

  useEffect(() => {
    const saveData = (db:IDBDatabase) => {
      const objectStores = db.transaction([BALANCE_SHEET_STORE_NAME], 'readwrite')

      const dataStore = objectStores.objectStore(BALANCE_SHEET_STORE_NAME)
      dataStore.put(data)

      objectStores.onerror = (ev) => {
        console.error("There was an error saving data into indexDB, event:")
        console.error(ev)
      }
    }

    if(!dbActive && db){
      saveData(db)
    }
  }, [dbActive, db, data])

  return {
    data,
    loading,
    error
  }
}
