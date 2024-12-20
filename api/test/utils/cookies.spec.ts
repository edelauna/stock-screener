import { env } from "cloudflare:test";
import { describe, expect, it, vi } from "vitest";
import { getPublicKey, signMessage, verifyMessage } from "../../src/utils/cookies";
import { base64UrlEncoder } from "../../src/utils/jwt";

const mockPrivateKey = JSON.stringify({
  "alg": "RS256",
  "d": "VIHoTpyrg45Wha5MuOcGvPVZwqFGscQ3OHwmn_6kMCA_gESL6LQ4B4-BhfujmeIeI-J3Qiqc-Tto0nW13gdIoQ",
  "dp": "wS7S0I15WfkG4Owj_V8wrjI1ECWzD3zI_PEVlHFVClE",
  "dq": "tteZrn9xqNbNbSU5iWCmG4732hK3Bdo0J13IE1sCQ9s",
  "e": "AQAB",
  "kty": "RSA",
  "n": "8KmV51ZnFDBNSnDZC6TpVwZy6YeVr98sKNdDvI6oeP-nqHzo05nt_t7IBBOcrqh8AEa9g7CDb7Er3z96qG_EYw",
  "p": "_PwgrIiXP8vJUO-W4EkULVZRio3tf6IqZR8cAR6spJE",
  "q": "84fch0F_doaQirKU8lquSCrYuDs7xuwO2Klwe8ybA7M",
  "qi": "w7o5_lLCnx9XdCIWvI52pj75LjIB9UsyhR9q3gQQ-C0"
})

describe('JWT Signing and Verification', () => {
  describe('getPublicKey', () => {
    it('should import the public key correctly', async () => {
      const key = await getPublicKey(env);

      expect(key).toBeInstanceOf(CryptoKey)
    });
  });

  describe('signMessage', () => {
    it('should sign a message correctly', async () => {
      const message = { foo: 'bar' };

      const result = await signMessage(message, { ...env, RSA_PRIVATE_KEY: mockPrivateKey });

      expect(result).toBe(`eyJmb28iOiJiYXIifQ.sH7lWoTsb9vyYiuEmFmDo5egyWOEImAYpvPTxSlGlbHvs5fk6D6ndIFLKyKIZwWF9piLV112v3ptSzShsAirGw`);
    });
  });

  describe('verifyMessage', () => {
    it('should verify a valid message correctly', async () => {
      const message = { foo: 'bar' };
      const encodedMessage = base64UrlEncoder(JSON.stringify(message));
      const encodedSignature = 'sH7lWoTsb9vyYiuEmFmDo5egyWOEImAYpvPTxSlGlbHvs5fk6D6ndIFLKyKIZwWF9piLV112v3ptSzShsAirGw';
      const signedMessage = `${encodedMessage}.${encodedSignature}`;

      const result = await verifyMessage(signedMessage, { ...env, RSA_PRIVATE_KEY: mockPrivateKey });

      expect(result).toEqual({ isValid: true, payload: message });
    });

    it('should handle an invalid message correctly', async () => {
      const message = { foo: 'bar' };

      const encodedMessage = base64UrlEncoder(JSON.stringify(message));
      const mockSignature = new Uint8Array([1, 2, 3, 4, 5]);
      const encodedSignature = base64UrlEncoder(String.fromCharCode(...mockSignature));
      const signedMessage = `${encodedMessage}.${encodedSignature}`;

      const result = await verifyMessage(signedMessage, env);

      expect(result).toEqual({ isValid: false, payload: message });
    });
  });
});

