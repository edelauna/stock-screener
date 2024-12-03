import { useCallback, useEffect, useState } from "react"

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
  value: generateRandomString(128),  
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
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}
const tenant = process.env.REACT_APP_AUTH_TENANT
const policy = process.env.REACT_APP_AUTH_POLICY_ID
const clientId = process.env.REACT_APP_AUTH_CLIENT_ID
const responseType = 'code+id_token'
const redirectURI = encodeURIComponent(process.env.REACT_APP_AUTH_REDIRECT_URI ?? '')
const scope = encodeURIComponent(`openid offline_access ${process.env.REACT_APP_AUTH_API_SCOPE}`)
const responseMode = 'fragment'

export const useAuth = () => {
  const [verifier, setVerifier] = useState(initializeVerifier())
  const [codeChallenge, setCodeChallenge] = useState<string|null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const generateCodeChallenge = async () => {
      sessionStorage.setItem(PKCE_KEY, JSON.stringify(verifier))
      const sha256hex = await createSHA256(verifier.value)
      setCodeChallenge(btoa(sha256hex))
    }
    
    if(verifier.expiry < new Date().getTime()){
      setVerifier(initializeVerifier())
      setCodeChallenge(null)
    } else {
      generateCodeChallenge() 
    }
  }, [verifier])

  useEffect(() => codeChallenge === null ? setReady(false) : setReady(true), [codeChallenge])

  const buildURL = useCallback(() => 
    `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/oauth2/v2.0/authorize?` +
    `client_id=${clientId}` +
    `&response_type=${responseType}&response_mode=${responseMode}` +
    `&redirect_uri=${redirectURI}` +
    `&scope=${scope}` +
    `&code_challenge=${codeChallenge}&code_challenge_method=S256`
  , [codeChallenge])

  return {
    ready,
    authURL: buildURL()
  }
}