import { env, createExecutionContext, fetchMock } from "cloudflare:test";
import { describe, it, expect, beforeAll, afterEach, beforeEach } from "vitest";
import { base64UrlEncoder, verify } from "../../src/utils/jwt";
import { CustomExecutionContext } from "../../src/utils/middleware";

describe('verify function', () => {
  beforeAll(() => {
    // Enable outbound request mocking...
    fetchMock.activate();
    // ...and throw errors if an outbound request isn't mocked
    fetchMock.disableNetConnect();
  });

  let privateKey: CryptoKey;
  beforeEach(async () => {
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
    const publicKey = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as JsonWebKey
    fetchMock.get(`https://${env.PUBLIC_KEY_TENANT}.b2clogin.com`)
      .intercept({ path: `/${env.PUBLIC_KEY_TENANT}.onmicrosoft.com/${env.PUBLIC_KEY_POLICY_ID}/discovery/v2.0/keys` })
      .reply(200, JSON.stringify({
        keys: [{
          kid: "some-id", e: publicKey.e, n: publicKey.n, kty: publicKey.kty
        }]
      }))
    privateKey = cryptoKeys.privateKey
  })
  afterEach(() => fetchMock.assertNoPendingInterceptors());

  it('should verify a valid JWT and extract user data', async () => {
    const ctx: CustomExecutionContext = createExecutionContext();

    const payload = {
      aud: env.AZURE_API_CLIENT_ID,
      oid: 'some-oid',
      exp: new Date().getTime() + 1000
    }
    const header = base64UrlEncoder(JSON.stringify({ kid: 'some-id' }))
    const payload64 = base64UrlEncoder(JSON.stringify(payload))
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${payload64}`))
    const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))
    const validJwt = [header, payload64, sig64].join('.'); // Example JWT, you need a valid form

    const result = await verify(validJwt, env, ctx);

    expect(result.isVerified).toBe(true);
    expect(ctx.user).toEqual(payload);
    expect(result.expired).toBe(false);
  });

  it('should return not verified for an invalid JWT', async () => {
    const ctx: CustomExecutionContext = createExecutionContext();

    const invalidJwt = `${base64UrlEncoder(JSON.stringify({ kid: 'some-id' }))}.` +
      `${base64UrlEncoder('{}')}.${base64UrlEncoder('invalidSig')}`;

    const result = await verify(invalidJwt, env, ctx);

    expect(result.isVerified).toBe(false);

    expect(ctx.user).toBeUndefined();
    expect(result.expired).toBe(true);
  });

  it('should mark a JWT as expired if exp is in the past', async () => {
    const ctx: CustomExecutionContext = createExecutionContext();

    const payload = {
      aud: env.AZURE_API_CLIENT_ID,
      oid: 'some-oid',
      exp: 0
    }
    const header = base64UrlEncoder(JSON.stringify({ kid: 'some-id' }))
    const payload64 = base64UrlEncoder(JSON.stringify(payload))
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, new TextEncoder().encode(`${header}.${payload64}`))
    const sig64 = base64UrlEncoder(String.fromCharCode(...new Uint8Array(signature)))
    const validJwt = [header, payload64, sig64].join('.'); // Example JWT, you need a valid form

    const result = await verify(validJwt, env, ctx);

    expect(result.isVerified).toBe(true);
    expect(result.expired).toBe(true);

    expect(ctx.user).toEqual(payload);
  });
});
