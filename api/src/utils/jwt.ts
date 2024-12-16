import { CustomExecutionContext } from "./middleware"

type PartialRSAJWK = {
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

type PublicKeys = {
  [kid: string]: PartialRSAJWK
}

type Header = {
  alg: string,
  kid: string,
  typ: string,
}

export type Payload = {
  aud: string,
  iss: string,
  exp: number,
  nbf: number,
  oid: string,
  sub: string,
  name: string,
  tfp: string,
  scp: string,
  azp: string,
  ver: string,
  iat: number
}

const getPublicKeys = async (env: Env, ctx: CustomExecutionContext): Promise<PublicKeys> => {
  const cache = caches.default
  const url = `https://${env.PUBLIC_KEY_TENANT}.b2clogin.com/${env.PUBLIC_KEY_TENANT}.onmicrosoft.com/${env.PUBLIC_KEY_POLICY_ID}/discovery/v2.0/keys`
  const cachedResponse = await cache.match(url)
  const response = cachedResponse ? cachedResponse : await fetch(url, {
    cf: {
      cacheTtl: 60 * 1000 * 30 // 30 minutes
    }
  })
  ctx.waitUntil(cache.put(url, response.clone()))

  const { keys }: KeysResponse = await response.json()
  return keys.reduce((prev: PublicKeys, { kid, kty, n, e }) => {
    prev[kid] = { kty, n, e }
    return prev
  }, {})
}

export const base64UrlDecoder = (msg: string) => atob(msg.replace(/-/g, '+').replace(/_/g, '/'))

export const base64UrlEncoder = (msg: string) => btoa(msg).replace(/\+/g, '+').replace(/\//g, '_').replace(/=/g, '')


export const verify = async (jwt: string, env: Env, ctx: CustomExecutionContext) => {
  let isVerified = false
  let expired = false

  const parts = jwt.split('.')
  if (parts.length !== 3) return { isVerified, expired }

  const header: Header = JSON.parse(base64UrlDecoder(parts[0]))
  const publicKeyData = (await getPublicKeys(env, ctx))[header.kid]

  const signedInput = parts.slice(0, 2).join('.')
  const signature = parts[2]
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'jwk',
    publicKeyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['verify']
  )
  isVerified = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    Uint8Array.from(base64UrlDecoder(signature), c => c.charCodeAt(0)),
    encoder.encode(signedInput)
  )

  const payload: Payload = JSON.parse(base64UrlDecoder(parts[1]))

  if (isVerified && payload.aud === env.AZURE_API_CLIENT_ID) {
    isVerified = true
    ctx.user = payload
  }

  if (!payload.exp || payload.exp * 1000 < new Date().getTime()) expired = true

  return { isVerified, expired }
}
