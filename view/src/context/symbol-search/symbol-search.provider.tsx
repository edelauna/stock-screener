import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { Actions, ActionType} from "./symbol-search.actions";
import { SymbolSearchResult } from "../../hooks/use-symbol-search";
import { useDb } from "../../hooks/use-db";
import { SYMBOL_SEARCH_STORE_NAME } from "../db/db";
import { errorStore } from "../errors/errors.provider";
import { Add } from "../errors/errors.actions";

export interface State {
  bestMatches: SymbolSearchResult[];
  activeSymbol: SymbolSearchResult
  currentInputRef: string;
  currentDataRef: string;
  busy: boolean
}

export const initialState = {
  currentInputRef: "",
  currentDataRef: "",
  busy: false,
  bestMatches: [],
  activeSymbol: {
    "1. symbol": '',
    "2. name": '',
    "3. type": '',
    "4. region": '',
    "5. marketOpen": '',
    "6. marketClose": '',
    "7. timezone": '',
    "8. currency": '',
    "9. matchScore": ''
  },
}

type SymbolSearchContext = {
  state: State; // potentially undefined while loading from localstate
  dispatch: React.Dispatch<Actions>;
};

export const store = createContext<SymbolSearchContext>({
  state: initialState,
  dispatch: () => null,
});

const reducer: React.Reducer<State, Actions> = (
  state: State,
  action: Actions,
) => {
  switch (action.type) {
    case ActionType.Refresh:
      return {
        ...state,
        bestMatches: action.payload
      }
    case ActionType.UpdateBusyStatus:
      return {
        ...state,
        busy: action.payload,
      }
    case ActionType.UpdateActiveSymbol:
      return {
        ...state,
        activeSymbol: action.payload,
      }
    case ActionType.UpdateCurrentDataRef:
      return {
        ...state,
        currentDataRef: action.payload,
      }
    case ActionType.UpdateCurrentInputRef:
      return {
        ...state,
        currentInputRef: action.payload,
      }
    default:
      return state;
  }
};

const { Provider } = store;

export const SymbolSearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {dispatch: errorDispatch} = useContext(errorStore)
  /**
   * side effect - load from indexDB
   */
  const {db, active: dbActive} = useDb()
  const currentDataRef = useRef<string | null>(null)

  useEffect(() => {
    const setState = (db:IDBDatabase, state: State) => {
      const objectStores = db.transaction([SYMBOL_SEARCH_STORE_NAME], 'readwrite')

      const dataStore = objectStores.objectStore(SYMBOL_SEARCH_STORE_NAME)
      dataStore.put({bestMatches: state.bestMatches, input: state.currentDataRef})

      objectStores.onerror = (ev) => {
        errorDispatch(Add({
          header: "SymbolSearchProvider::There was an error saving data into indexDB",
          body: JSON.stringify(ev)
        }))
      }
    }
    if (!dbActive && db) {
      if(currentDataRef.current !== state.currentDataRef) {
        if(state.bestMatches.length > 0)
          setState(db, state)
        currentDataRef.current = state.currentDataRef
      }
    }
  }, [db, dbActive, state, errorDispatch]) // add symbol dependancy

  return <Provider value={{ state, dispatch }} children={children} />;
};
