import { useCallback } from "react"
import { PartialRSAJWK } from "../../../auth/use-keys"
import { base64UrlDecoder } from "../../../../context/navigation/navigation.provider"

export const useVerifyCB = () => {
  return useCallback(async (localKey: PartialRSAJWK,payload: string) => {
    const [body, signature] = payload.split('.')
    const encoder = new TextEncoder()
    const key = await window.crypto.subtle.importKey(
      'jwk',
      localKey!,
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
        encoder.encode(body)
      )
    return({isValid, payload: JSON.parse(base64UrlDecoder(body))})
  }, [])
}
