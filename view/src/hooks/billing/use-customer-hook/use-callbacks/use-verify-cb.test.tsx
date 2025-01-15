import { renderHook } from "@testing-library/react";
import { base64UrlEncoder } from "../../../../context/navigation/navigation.provider.test";
import { useVerifyCB } from "./use-verify-cb";

describe("useVerifyCB", () => {
  it("validates the signature and returns the payload", async () => {
    const cryptoKeys = await crypto.subtle
      .generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      ) as CryptoKeyPair
    const localKey = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as {e: string, n: string, kty: string}
    const decodedPayload = { some_field: "Value" };
    const payload64 = base64UrlEncoder(JSON.stringify(decodedPayload))
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKeys.privateKey, new TextEncoder().encode(payload64))
    const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))
    const payload = [payload64, sig64].join('.'); // Example JWT, you need a valid form

    const { result } = renderHook(() => useVerifyCB());

    // Call the callback function
    const response = await result.current(localKey, payload);

    expect(response).toEqual({ isValid: true, payload: decodedPayload });
  });

  it("returns false when the signature is invalid", async () => {
    const cryptoKeys = await crypto.subtle
    .generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    ) as CryptoKeyPair
    const localKey = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as {e: string, n: string, kty: string}
    const decodedPayload = { some_field: "Value" };
    const payload64 = base64UrlEncoder(JSON.stringify(decodedPayload))

    const payload = payload64 +
                    '.c3RyaW5n'; // Example base64url encoded string

    const { result } = renderHook(() => useVerifyCB());

    // Call the callback function
    const response = await result.current(localKey, payload);

    // Assertions
    expect(response).toEqual({ isValid: false, payload: decodedPayload});
  });
});
