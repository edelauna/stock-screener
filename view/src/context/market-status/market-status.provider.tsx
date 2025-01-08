import React, { createContext, useEffect, useReducer } from "react";
import { Actions, ActionType, Refresh, UpdateInitializingStatus } from "./market-status.actions";

export interface Data {
  endpoint: string,
  markets: GlobalMarketData[],
}

export interface GlobalMarketData {
  "market_type": string,
  "region": string,
  "primary_exchanges": string,
  "local_open": string,
  "local_close": string,
  "current_status": string,
  "notes": string
}

export interface State {
  markets: Data["markets"];
  currentRef: string;
  initializing: boolean
}

const MARKET_STATUS_STORE_NAME = "market-status"

export const initialState = {
  currentRef: "",
  initializing: true,
  markets: []
}

const getInitialState = (): State => {
  try {
    const data = localStorage.getItem(MARKET_STATUS_STORE_NAME)
    if (data) {
      return { ...JSON.parse(data), initializing: false }
    }
    else {
      return { ...initialState, initializing: false }
    }
  } catch (_) {
    return { ...initialState, initializing: false }
  }
}

type MarketStatusContext = {
  state: State; // potentially undefined while loading from localstate
  dispatch: React.Dispatch<Actions>;
};

export const store = createContext<MarketStatusContext>({
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
        ...action.payload
      }
    case ActionType.UpdateInitializingStatus:
      return {
        ...state,
        initializing: action.payload,
      }
    default:
      return state;
  }
};

const { Provider } = store;

export const MarketStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * side effect - save to localStorage
   */
  useEffect(() => {
    if (state.initializing) {
      dispatch(Refresh(getInitialState()))
      dispatch(UpdateInitializingStatus(false))
    } else {
      localStorage.setItem(MARKET_STATUS_STORE_NAME, JSON.stringify(state))
    }
  }, [state, dispatch])

  return <Provider value={{ state, dispatch }} children={children} />;
};
