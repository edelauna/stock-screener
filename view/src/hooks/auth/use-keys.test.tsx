import { renderHook, waitFor } from "@testing-library/react";
import { useLocalKey, usePublicKeys } from "./use-keys";
import { mswServer } from "../../setupTests";
import { rest } from "msw";

describe('usePublicKeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and sets public keys correctly', async () => {
    const mockKeys = [
      { kid: 'key1', e: 'AQAB', n: 'testn1', kty: 'RSA' },
      { kid: 'key2', e: 'AQAB', n: 'testn2', kty: 'RSA' },
    ];

    mswServer.use(
      rest.get(
        `https://${process.env.REACT_APP_AUTH_TENANT}.b2clogin.com/${process.env.REACT_APP_AUTH_TENANT}.onmicrosoft.com/${process.env.REACT_APP_AUTH_POLICY_ID}/discovery/v2.0/keys`,
        (_, res, ctx) => res(ctx.json({ keys: mockKeys }))
      )
    )

    const { result } = renderHook(() => usePublicKeys());

    expect(result.current.publicKeys).toEqual({});

    await waitFor(() =>    expect(result.current.publicKeys).toEqual({
      key1: { e: 'AQAB', n: 'testn1', kty: 'RSA' },
      key2: { e: 'AQAB', n: 'testn2', kty: 'RSA' },
    }))
  });
});

describe('useLocalKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and sets the local key correctly', async () => {
    const mockLocalKey = {
      e: 'AQAB',
      n: 'testn',
      kty: 'RSA',
    };

    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}keys`,(_, res, ctx) => res(ctx.json(mockLocalKey)))
    )

    const { result } = renderHook(() => useLocalKey());

    expect(result.current.localKey).toBeUndefined();

    await waitFor(() =>  expect(result.current.localKey).toEqual(mockLocalKey))
  });
});
