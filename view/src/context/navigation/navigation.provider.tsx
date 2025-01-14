import React, { createContext, useContext, useEffect, useReducer, useRef } from "react";
import { Actions, ActionType, AuthUrl, Identity, IdentityToken, RawCustomer, RawIdentity, Redirect } from "./navigation.actions";
import { PartialRSAJWK, usePublicKeys } from "../../hooks/auth/use-keys";
import { errorStore } from "../errors/errors.provider";
import { Add } from "../errors/errors.actions";
import { useNavigate } from "react-router";
import { useAuth } from "./hooks/use-auth";
import { useLogout } from "./hooks/use-logout";

export interface NavigationItem extends SimpleNavigationItem {
  current: boolean;
  id: string;
}

export interface SimpleNavigationItem {
  name: string;
}

export type State = {
  navigation: NavigationItem[];
  redirect: boolean
  identityToken: IdentityToken | null
  rawIdentityToken: string
  rawCustomerToken: string
  authUrl: string | null
}

const SESSION_STORAGE_KEY = 'identity_storage'
const CUSTOMER_JWT_KEY = 'customer'

export const initialState: State = {
  navigation: [
    { name: 'Home', id: 'home', current: true },
    { name: 'About', id: 'about', current: false },
  ],
  redirect: false,
  identityToken: null,
  rawIdentityToken: '',
  rawCustomerToken: '',
  authUrl: null,
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
    case ActionType.RawCustomer:
      return {
        ...state,
        rawCustomerToken: action.payload
      }
    case ActionType.AuthUrl:
      return {
        ...state,
        authUrl: action.payload
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
        rawIdentityToken: sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '',
        rawCustomerToken: sessionStorage.getItem(CUSTOMER_JWT_KEY) ?? ''
      }
    } catch(e){
      errorDispatch(Add({
        header: 'NavigationProvider:initialState:error',
        body: (e as Error).message
      }))
      return state
    }
  })

  //ttl for redirect
  useEffect(() => {
    if(state.redirect){
      const poll = () => dispatch(Redirect(false)) // should've happened by 5 seconds
      const intervalId = setInterval(poll, 5000);
      return () => clearInterval(intervalId)
    }
  },[state.redirect])

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
          dispatch(RawIdentity(''))
          dispatch(RawCustomer(''))
        }
      } catch (e) {
        errorDispatch(Add({
          header: 'NavigationProvider:validate:error:',
          body: (e as Error).message
        }))
        dispatch(RawIdentity(''))
        dispatch(RawCustomer(''))
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
  useEffect(() => sessionStorage.setItem(CUSTOMER_JWT_KEY, state.rawCustomerToken), [state.rawCustomerToken])

  const {ready: authReady, authURL, tokens, loggingIn} = useAuth()

  useEffect(() => {
    if(authReady) dispatch(AuthUrl(authURL))
  }, [authReady,authURL,dispatch])

  useEffect(() => dispatch(Redirect(loggingIn)), [dispatch,loggingIn])

  useEffect(() => {
    if(tokens){
      dispatch(RawIdentity(tokens.id_token))
      dispatch(RawCustomer(tokens.customer_token))
    }
  }, [tokens, dispatch])

  const loggingOutRef = useRef(false)
  const {loggingOut} = useLogout(state.rawIdentityToken)

  useEffect(() => {
    if(loggingOutRef.current === true && loggingOut === false) {
      // finished logging out
      dispatch(RawIdentity(''))
      dispatch(RawCustomer(''))
    }
    loggingOutRef.current = loggingOut
    dispatch(Redirect(loggingOut))
  }, [dispatch,loggingOut])

  return <Provider value={{state, dispatch}} children={children} />
}
