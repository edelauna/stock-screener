import { Customer } from "./billing";
import { base64UrlDecoder, base64UrlEncoder } from "./jwt";

export type CustomerCookie = {
  customer: Customer,
  oid: string,
}

export const getPublicKey = (env: Env) => {
  const { alg, e, kty, n } = JSON.parse(env.RSA_PRIVATE_KEY)
  return crypto.subtle.importKey(
    'jwk',
    { alg, e, kty, n },
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: { name: 'SHA-256' }
    },
    false,
    ['verify']
  )
}

const getPrivateKey = (env: Env) => crypto.subtle.importKey(
  'jwk',
  JSON.parse(env.RSA_PRIVATE_KEY),
  {
    name: 'RSASSA-PKCS1-v1_5',
    hash: { name: 'SHA-256' }
  },
  false,
  ['sign']
);

export const signMessage = async <T>(message: T, env: Env) => {
  const encoder = new TextEncoder()
  const key = await getPrivateKey(env)

  const body = base64UrlEncoder(JSON.stringify(message))
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(body))
  const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))

  return [body, sig64].join('.')
}

export const verifyMessage = async <T>(
  signedMessage: string,
  env: Env
): Promise<{ isValid: boolean, payload: T }> => {
  const [body, receivedSignature] = signedMessage.split('.');
  const encoder = new TextEncoder();

  const key = await getPublicKey(env)

  const sigBuf = Uint8Array.from(base64UrlDecoder(receivedSignature), c => c.charCodeAt(0))

  const isValid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    sigBuf,
    encoder.encode(body)
  );
  return { isValid, payload: JSON.parse(base64UrlDecoder(body)) }
}
