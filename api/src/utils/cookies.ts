import { base64UrlDecoder, base64UrlEncoder } from "./jwt";

const getKey = (env: Env) => crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(env.HMAC_SIGNING_KEY),
  {
    name: 'HMAC',
    hash: { name: 'SHA-256' }
  },
  false,
  ['sign', 'verify']
);

export const signMessage = async <T>(message: T, env: Env) => {
  const encoder = new TextEncoder()
  const key = await getKey(env)

  const body = base64UrlEncoder(JSON.stringify(message))
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
  const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))

  return [body, sig64].join('.')
}

export const verifyMessage = async <T>(
  signedMessage: string,
  env: Env
): Promise<{ isValid: boolean, payload: T }> => {
  const [body, receivedSignature] = signedMessage.split('.');
  const encoder = new TextEncoder();

  const key = await getKey(env)

  const sigBuf = Uint8Array.from(base64UrlDecoder(receivedSignature), c => c.charCodeAt(0))

  const isValid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBuf,
    encoder.encode(body)
  );
  return { isValid, payload: JSON.parse(base64UrlDecoder(body)) }
}
