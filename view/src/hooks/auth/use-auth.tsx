import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router"
import { navigationStore } from "../../context/navigation/navigation.provider"
import { Identity, RawIdentity, Redirect } from "../../context/navigation/navigation.actions"
import { errorStore } from "../../context/errors/errors.provider"
import { Add } from "../../context/errors/errors.actions"

const PKCE_KEY = 'pkce_verifier'

type State = {
  value: string,
  expiry: number
}

const TEN_MINUTES = 10 * 60 * 1000

const generateRandomString = (length: number) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset.charAt(randomIndex);
  }
  return result;
}

const initialState = {
  value: generateRandomString(43),
  expiry: new Date().getTime() + TEN_MINUTES // expires in 10 minutes
}

const initializeVerifier = () => {
  try {
    const data = sessionStorage.getItem(PKCE_KEY)
    if(!data) return initialState
    const state: State = JSON.parse(data)
    if(state.expiry < new Date().getTime()) return initialState
    return state
  } catch (_) {
    return initialState
  }
}

const createSHA256 = async (msg: string) => {
  const msgUint8 = new TextEncoder().encode(msg); // encode as (utf-8) Uint8Array
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashBinary = String.fromCharCode(...hashArray);
  const base64Encoded = btoa(hashBinary);

  return base64Encoded;
}
const tenant = process.env.REACT_APP_AUTH_TENANT
const policy = process.env.REACT_APP_AUTH_POLICY_ID
const clientId = process.env.REACT_APP_AUTH_CLIENT_ID
const responseType = 'code+id_token'
const redirectURI = encodeURIComponent(process.env.REACT_APP_AUTH_REDIRECT_URI ?? '')
const scope = encodeURIComponent(`openid offline_access ${process.env.REACT_APP_AUTH_API_SCOPE}`)
const responseMode = 'fragment'

export const useAuth = () => {
  const {state, dispatch} = useContext(navigationStore)
  const {dispatch: errorDispatch} = useContext(errorStore)
  const [verifier, setVerifier] = useState(initializeVerifier())
  const [codeChallenge, setCodeChallenge] = useState<string|null>(null)
  const [ready, setReady] = useState(false)
  const lastCodeRef = useRef('')

  useEffect(() => {
    const generateCodeChallenge = async () => {
      sessionStorage.setItem(PKCE_KEY, JSON.stringify(verifier))
      const sha256b64 = await createSHA256(verifier.value)
      if(codeChallenge !== sha256b64)
        setCodeChallenge(sha256b64
          .replace(/\+/g, '-')
          .replace(/\//g, '_')  // Replace / with _
          .replace(/=+$/, '')
        )
    }

    if(verifier.expiry < new Date().getTime()){
      setVerifier(initializeVerifier())
      setCodeChallenge(null)
    } else {
      generateCodeChallenge()
    }
  }, [verifier, codeChallenge])

  useEffect(() => codeChallenge === null ? setReady(false) : setReady(true), [codeChallenge])

  const buildAuthURL = useCallback(() =>
    `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=${responseType}&response_mode=${responseMode}` +
    `&redirect_uri=${redirectURI}` +
    `&scope=${scope}` +
    `&code_challenge=${codeChallenge}&code_challenge_method=S256`
  , [codeChallenge])

  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const fetchData = async (code: string) => {
      const url = `${process.env.REACT_APP_API_URL}auth/token`
      try {
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Content-Type' : 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ code, verifier}),
        })
        if(!response.ok) return errorDispatch(Add({
          header: 'useAuth::Fetch token response not ok',
          body: await response.text()
        }))

        const {id_token} = await response.json()
        dispatch(RawIdentity(id_token))
      } catch (e){
        errorDispatch(Add({
          header: 'useAuth::There was an error fetching token',
          body: (e as Error).message
        }))
      } finally {
        setCodeChallenge(null)
        navigate('/')
        dispatch(Redirect(false))
      }
    }

    const doLogout = async (idToken: string) => {
      const url = `${process.env.REACT_APP_API_URL}auth/logout`
      try {
        const response = await fetch(url, {
          credentials: 'include',
          redirect: 'follow',
          headers: {
            'Content-Type' : 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({ id_token: idToken}),
        })
        const {redirect_uri} = await response.json()
        window.location = redirect_uri
      } catch (e){
        errorDispatch(Add({
          header: 'useAuth::There was an error fetching token',
          body: (e as Error).message
        }))
      } finally {
        setCodeChallenge(null)
        navigate('/')
        dispatch(Redirect(false))
      }
    }

    // want to handle login/logout anywhere in the app
    if(location.pathname.startsWith('/auth')){
      if(location.hash){
        const params = new URLSearchParams(location.hash.substring(1))
        const code = params.get('code')
        if(code && lastCodeRef.current !== code) {
          lastCodeRef.current = code
          dispatch(Redirect(true))
          fetchData(code)
        }
      }
      if(location.pathname.split('/')[2] === 'logout' && state.rawIdentityToken !== ''){
        dispatch(Redirect(true))
        doLogout(state.rawIdentityToken)
        dispatch(RawIdentity(''))
        dispatch(Identity(null))
      }
    }
  }, [location, verifier, dispatch, navigate, state.rawIdentityToken, errorDispatch])


  return {
    ready,
    authURL: buildAuthURL()
  }
}
