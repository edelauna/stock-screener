import React, { createContext, useReducer } from "react";
import { Actions, ActionType } from "./errors.actions";


export type ErrorDialog = {
  id: string,
  header: string,
  body: string
}

type State = {
  errors: ErrorDialog[],
  show: boolean
  showCTA: boolean
}

const initialState = {
  errors: [],
  show: false,
  showCTA: false
}

export const generateIssueLink = (msg: ErrorDialog) =>
  `https://github.com/edelauna/stock-screener/issues/new?title=${encodeURIComponent(msg.header)}&body=${encodeURIComponent(msg.body)}&labels=bug`

type ErrorContext = {
  state: State; // potentially undefined while loading from localstate
  dispatch: React.Dispatch<Actions>;
};

export const errorStore = createContext<ErrorContext>({
  state: initialState,
  dispatch: () => null,
});

const reducer: React.Reducer<State, Actions> = (
  state: State,
  action: Actions,
) => {
  switch (action.type) {
    case ActionType.Add:
      return {
        ...state,
        errors: [action.payload, ...state.errors]
      }
    case ActionType.Remove:
      return {
        ...state,
        errors: state.errors.filter(e => e.id !== action.payload)
      }
    case ActionType.RemoveAll:
      return {
        ...state,
        errors: [],
      }
    case ActionType.ToggleShow:
      return {
        ...state,
        show: action.payload
      }
    case ActionType.CtaResolvable:
      return {
        ...state,
        showCTA: action.payload
      }
    default:
      return state;
  }
};

const { Provider } = errorStore;

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return <Provider value={{ state, dispatch }} children={children} />;
};
