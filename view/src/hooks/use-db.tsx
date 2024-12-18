import { useCallback, useContext, useEffect, useState } from "react"
import { INDEX_DB_NAME, INDEX_DB_VERSION, onUpgradeNeededCallBack } from "../context/db/db";
import { errorStore } from "../context/errors/errors.provider";
import { Add } from "../context/errors/errors.actions";

export const useDb = () => {
  const {dispatch} = useContext(errorStore)
  const [active, setActive] = useState(true)
  const [db, setDb] = useState<IDBDatabase | null>(null)

  const setErrorCb = useCallback((request: IDBOpenDBRequest) => dispatch(Add({
    header:'Database error occured',
    body: request.error?.message ?? ''
  })), [dispatch])

  useEffect(() => {
      const request = indexedDB.open(INDEX_DB_NAME, INDEX_DB_VERSION)

      request.onerror = (ev) => setErrorCb(ev.target as IDBOpenDBRequest)

      request.onsuccess = (event) => {
        setDb((event.target as IDBOpenDBRequest).result)
        setActive(false)
      }

      request.onupgradeneeded = (event) => {
        const request = event.target as IDBOpenDBRequest
        setActive(true)
        const transaction = request.transaction!!
        const onUpgradeDb = request.result
        onUpgradeDb.onerror = (event) => setErrorCb(event.target as IDBOpenDBRequest)
        const {oldVersion} = event
        onUpgradeNeededCallBack(onUpgradeDb, {oldVersion, transaction});
        transaction.oncomplete = (ev: Event) => {
          setDb(onUpgradeDb);
          setActive(false)
        }
      }
  }, [setErrorCb])

  return {
    db, active
  }
}
