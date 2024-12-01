import React, { createContext, useReducer } from "react";
import { Actions, ActionType } from "./navigation.actions";

export interface NavigationItem extends SimpleNavigationItem {
  current: boolean;
  id: string;
}

export interface SimpleNavigationItem {
  name: string;
}

type State = {
  navigation: NavigationItem[];
}

const initialState: State = {
  navigation: [
    { name: 'Home', id: 'home', current: true },
    { name: 'About', id: 'about', current: false },
  ]
}

type NavigationContext = {
  state: State
  dispatch: React.Dispatch<Actions>
}

const reducer: React.Reducer<State, Actions> = (
  state: State,
  action: Actions
) => {
  switch(action.type) {
    case ActionType.Navigate:
      const match = state.navigation.filter(n => n.id === action.payload)
      if(match.length < 1) return state
      return {
        navigation: state.navigation.map(n => {
          n.current = false
          if(n.id === action.payload) n.current = true
          return n
        })
      }
  }
}

export const navigationStore = createContext<NavigationContext>({
  state: initialState,
  dispatch: () => null
})

const { Provider } = navigationStore

export const NavigationProvider = ({children}: {children: React.ReactNode}) => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return <Provider value={{state, dispatch}} children={children} />
}