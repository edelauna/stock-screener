import { useCallback, useEffect, useState } from "react"
import { INDEX_DB_NAME, INDEX_DB_VERSION, onUpgradeNeededCallBack } from "../context/db/db";

export const useDb = () => {
  const [error, setError] = useState("")
  const [active, setActive] = useState(true)
  const [db, setDb] = useState<IDBDatabase | null>(null)

  const setErrorCb = useCallback((request: IDBOpenDBRequest) => setError(request.error?.message ?? 'Database error occured'), [])

  useEffect(() => {
      const request = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION)

      request.onerror = (ev) => setErrorCb(ev.target as IDBOpenDBRequest)

      request.onsuccess = (event) => {
        setDb((event.target as IDBOpenDBRequest).result)
        setActive(false)
      }

      request.onupgradeneeded = (event) => {
        setActive(true)
        const onUpgradeDb = (event.target as IDBOpenDBRequest).result
        onUpgradeDb.onerror = (event) => setErrorCb(event.target as IDBOpenDBRequest)
        const {oldVersion} = event
        onUpgradeNeededCallBack(onUpgradeDb, {oldVersion});
        (onUpgradeDb.transaction as unknown as IDBTransaction).oncomplete = (ev: Event) => {
          setDb(onUpgradeDb); 
          setActive(false)
        }
      }
  }, [setErrorCb])

  return {
    db, active, error
  }
}