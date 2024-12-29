import { BALANCE_SHEET_STORE_NAME, INDEX_DB_NAME, onUpgradeNeededCallBack, SYMBOL_SEARCH_STORE_NAME, TIME_SERIES_DAILY_METADATA_STORE_NAME, TIME_SERIES_DAILY_STORE_NAME } from './db';

describe('onUpgradeNeededCallBack', () => {
  it('should create new stores and indexes when upgrading from version 0 to latest', (done) => {
    const request = indexedDB.open(INDEX_DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const transaction = request.transaction!!
      const onUpgradeDb = request.result
      const {oldVersion} = e
      onUpgradeNeededCallBack(onUpgradeDb, {oldVersion, transaction});
    }

    request.onsuccess = (e) => {
      const {result: db} = e.target as IDBOpenDBRequest
      // Check if the correct stores are created
      expect(db.objectStoreNames.contains(TIME_SERIES_DAILY_STORE_NAME)).toBe(true);
      expect(db.objectStoreNames.contains(TIME_SERIES_DAILY_METADATA_STORE_NAME)).toBe(true);
      expect(db.objectStoreNames.contains(SYMBOL_SEARCH_STORE_NAME)).toBe(true);
      expect(db.objectStoreNames.contains(BALANCE_SHEET_STORE_NAME)).toBe(true);

      // Check if the correct indexes are created
      const timeSeriesDailyStore = db.transaction(TIME_SERIES_DAILY_STORE_NAME).objectStore(TIME_SERIES_DAILY_STORE_NAME);
      expect(timeSeriesDailyStore.indexNames.contains('date')).toBe(true);
      expect(timeSeriesDailyStore.indexNames.contains('symbol')).toBe(true);
      expect(timeSeriesDailyStore.index('symbol').unique).toBe(false);

      const symbolSearchStore = db.transaction(SYMBOL_SEARCH_STORE_NAME).objectStore(SYMBOL_SEARCH_STORE_NAME);
      expect(symbolSearchStore.indexNames.length).toBe(0);

      const balanceSheetStore = db.transaction(BALANCE_SHEET_STORE_NAME).objectStore(BALANCE_SHEET_STORE_NAME);
      expect(balanceSheetStore.indexNames.length).toBe(0);
      done()
    }
  });
});
