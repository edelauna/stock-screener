import { SymbolSearchResult } from "../../hooks/use-symbol-search";
import { TimeSeriesDayData } from "../../hooks/use-time-series-daily/use-time-series-daily";

export const INDEX_DB_VERSION = 2;
export const INDEX_DB_NAME = 'webDB';

export const TIME_SERIES_DAILY_STORE_NAME = "time-series-daily"
export const TIME_SERIES_DAILY_METADATA_STORE_NAME = "time-series-daily-metadata"

export const SYMBOL_SEARCH_STORE_NAME = 'symbol-search'

export const BALANCE_SHEET_STORE_NAME = 'balance-sheet'

export type TimeSeriesDailyRow = {
  id: string,
  date: string,
  symbol: string,
} & TimeSeriesDayData

export type SymbolSearchRow = {
  input: string
  bestMatches: SymbolSearchResult[]
}

type DBConfig = {
  store: string,
  keyPath: string,
  indexes: {
    field: string,
    unique: boolean
  }[],
  implementedInVersion: number
}
const STORE_CONFIGS: DBConfig[] = [{
  store: TIME_SERIES_DAILY_STORE_NAME,
  keyPath: 'id',
  indexes: [{
    field: 'date', unique: true
  },{
    field: 'symbol', unique: false
  }],
  implementedInVersion: 1
},{
  store: TIME_SERIES_DAILY_METADATA_STORE_NAME,
  keyPath: 'symbol',
  indexes: [],
  implementedInVersion: 1
},{
  store: SYMBOL_SEARCH_STORE_NAME,
  keyPath: 'input',
  indexes: [],
  implementedInVersion: 1
},{
  store: BALANCE_SHEET_STORE_NAME,
  keyPath: 'symbol',
  indexes: [],
  implementedInVersion: 2
}]

interface OnUpdateNeededCallbackOptions {
  oldVersion: number,
}

export const onUpgradeNeededCallBack = (db: IDBDatabase, {oldVersion}: OnUpdateNeededCallbackOptions) => {
  debugger;
  STORE_CONFIGS.forEach((config) => {
    if(config.implementedInVersion > oldVersion){
      // create object stores
      const objectStore = db.createObjectStore(config.store, {keyPath: config.keyPath})
      
      // create indees
      config.indexes.forEach((idx) => {
        objectStore.createIndex(idx.field, idx.field, {unique: idx.unique})
      })
    }    
  })

}