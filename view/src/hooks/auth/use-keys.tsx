import { useEffect, useRef, useState } from "react"

type PublicKeyStruct = {
  [key: string]: PartialRSAJWK
}

export type PartialRSAJWK = {
  e: string,
  n: string,
  kty: string,
}
type RSAJWK = {
  kid: string,
} & PartialRSAJWK

type KeysResponse = {
  keys: RSAJWK[]
}

const tenant = process.env.REACT_APP_AUTH_TENANT
const policy = process.env.REACT_APP_AUTH_POLICY_ID


export const useKeys = () => {
  const [publicKeys, setPublicKeys] = useState<PublicKeyStruct>({})
  const fetched = useRef(false)

  useEffect(() => {
    const fetchKeys = async () => {
        const url = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/discovery/v2.0/keys`
        const response = await fetch(url)
        const {keys}: KeysResponse = await response.json()
        keys.forEach(k => setPublicKeys(pk => ({...pk, [k.kid] :{e: k.e, n:k.n, kty: k.kty}})))
    }

    if(Object.keys(publicKeys).length > 0) return

    if(!fetched.current){
      fetched.current = true
      fetchKeys()
    }
  }, [publicKeys])

  return {
    publicKeys
  }
}
