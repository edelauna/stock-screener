import React, { createContext, useContext, useEffect, useReducer } from "react";
import { Actions, ActionType, Identity, IdentityToken } from "./navigation.actions";
import { PartialRSAJWK, usePublicKeys } from "../../hooks/auth/use-keys";
import { errorStore } from "../errors/errors.provider";
import { Add } from "../errors/errors.actions";
import { useNavigate } from "react-router";

export interface NavigationItem extends SimpleNavigationItem {
  current: boolean;
  id: string;
}

export interface SimpleNavigationItem {
  name: string;
}

type State = {
  navigation: NavigationItem[];
  redirect: boolean
  identityToken: IdentityToken | null
  rawIdentityToken: string
}

const SESSION_STORAGE_KEY = 'identity_storage'

const initialState: State = {
  navigation: [
    { name: 'Home', id: 'home', current: true },
    { name: 'About', id: 'about', current: false },
  ],
  redirect: false,
  identityToken: null,
  rawIdentityToken: ''
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
        ...state,
        navigation: state.navigation.map(n => {
          n.current = false
          if(n.id === action.payload) n.current = true
          return n
        })
      }
    case ActionType.Redirect:
      return {
        ...state,
        redirect: action.payload
      }
    case ActionType.Identity:
      return {
        ...state,
        identityToken: action.payload
      }
    case ActionType.RawIdentity:
      return {
        ...state,
        rawIdentityToken: action.payload
      }
    default:
      return state
  }
}

export const navigationStore = createContext<NavigationContext>({
  state: initialState,
  dispatch: () => null
})

export const base64UrlDecoder = (msg: string) => atob(msg.replace(/-/g,'+').replace(/_/g,'/'))

const verify = async (parts: string[], keyData: PartialRSAJWK) => {
  const signedInput = parts.slice(0,2).join('.')
  const signature = parts[2]
  const encoder = new TextEncoder()
  const key = await window.crypto.subtle.importKey(
    'jwk',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['verify']
  )
  const isValid = await window.crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      key,
      Uint8Array.from(base64UrlDecoder(signature), c => c.charCodeAt(0)),
      encoder.encode(signedInput)
    )
  return isValid
}

const { Provider } = navigationStore

export const NavigationProvider = ({children}: {children: React.ReactNode}) => {
  const {dispatch: errorDispatch} = useContext(errorStore)
  const [state, dispatch] = useReducer(reducer, initialState, (state) => {
    try {
      return {
        ...state,
        rawIdentityToken: sessionStorage.getItem(SESSION_STORAGE_KEY) ?? ''
      }
    } catch(e){
      errorDispatch(Add({
        header: 'NavigationProvider:initialState:error',
        body: (e as Error).message
      }))
      return state
    }
  })
  const { publicKeys } = usePublicKeys()
  const navigate = useNavigate()

  // verify token updated to state
  useEffect(() => {
    const validate = async (parts: string[]) => {
      let validSignature = false
      // check signature
      for(const kid in publicKeys){
        const isValid = await verify(parts, publicKeys[kid])
        validSignature = validSignature ? validSignature : isValid
      }
      // parse for aud and exp check
      try {
        const header = JSON.parse(base64UrlDecoder(parts[0]))
        const payload: IdentityToken["payload"] = JSON.parse(base64UrlDecoder(parts[1]))

        if(validSignature && payload.aud === process.env.REACT_APP_AUTH_CLIENT_ID && (payload.exp * 1000 > new Date().getTime())){
          dispatch(Identity({header, payload, signature: parts[2]}))
        } else {
          navigate('/auth/logout')
        }
      } catch (e) {
        errorDispatch(Add({
          header: 'NavigationProvider:validate:error:',
          body: (e as Error).message
        }))
        navigate('/auth/logout')
      }
    }

    if(Object.keys(publicKeys).length === 0) return

    const jwt = state.rawIdentityToken

    if(jwt === '') return

    const parts = jwt.split('.')

    if(parts.length === 3) validate(parts)

  }, [state.rawIdentityToken, publicKeys, errorDispatch, navigate])

  // save identity token to session storage
  useEffect(() => sessionStorage.setItem(SESSION_STORAGE_KEY, state.rawIdentityToken), [state.rawIdentityToken])

  return <Provider value={{state, dispatch}} children={children} />
}
