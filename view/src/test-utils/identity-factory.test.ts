import { IdentityToken } from "../context/navigation/navigation.actions";

export type NestedPartial<T> = {
  [P in keyof T]?: T[P] extends object ? NestedPartial<T[P]> : T[P];
};

export const createIdentityToken = (overrides: NestedPartial<IdentityToken> = {}): IdentityToken => {
  const defaultToken: IdentityToken = {
    header: {
      alg: 'RS256',
      kid: 'some-key-id',
      typ: 'JWT',
    },
    payload: {
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      nbf: Math.floor(Date.now() / 1000), // Not before: now
      ver: '1.0',
      iss: 'https://example.com',

      sub: 'user123',
      aud: `${process.env.REACT_APP_AUTH_CLIENT_ID}`,
      iat: Math.floor(Date.now() / 1000), // Issued at: now
      auth_time: Math.floor(Date.now() / 1000), // Authentication time: now
      oid: 'user-oid',
      name: 'John Doe',
      tfp: 'B2C_1_SignUpOrSignIn',
      at_hash: 'some-at-hash',
    },
    signature: 'some-signature',
  };

  return {
    ...defaultToken,
    ...overrides,
    header: {
      ...defaultToken.header,
      ...overrides.header
    },
    payload: {
      ...defaultToken.payload,
      ...overrides.payload
    }
  } as IdentityToken;
};

describe('createIdentityToken', () => {
  // Helper function to create a mock Date object for consistent test results
  const mockDate = new Date('2023-01-01T00:00:00Z');
  jest.useFakeTimers().setSystemTime(mockDate);

  it('should create a token with default values', () => {
    const token = createIdentityToken();

    expect(token).toEqual({
      header: {
        alg: 'RS256',
        kid: 'some-key-id',
        typ: 'JWT',
      },
      payload: {
        exp: 1672534800, // 2023-01-01T01:00:00Z
        nbf: 1672531200, // 2023-01-01T00:00:00Z
        ver: '1.0',
        iss: 'https://example.com',
        sub: 'user123',
        aud: `${process.env.REACT_APP_AUTH_CLIENT_ID}`,
        iat: 1672531200, // 2023-01-01T00:00:00Z
        auth_time: 1672531200, // 2023-01-01T00:00:00Z
        oid: 'user-oid',
        name: 'John Doe',
        tfp: 'B2C_1_SignUpOrSignIn',
        at_hash: 'some-at-hash',
      },
      signature: 'some-signature',
    });
  });

  it('should create a token with custom values', () => {
    const customToken = createIdentityToken({
      header: {
        kid: 'custom-key-id',
      },
      payload: {
        sub: 'custom-user123',
        name: 'Jane Doe',
      },
      signature: 'custom-signature',
    });

    expect(customToken).toEqual({
      header: {
        alg: 'RS256',
        kid: 'custom-key-id',
        typ: 'JWT',
      },
      payload: {
        exp: 1672534800, // 2023-01-01T01:00:00Z
        nbf: 1672531200, // 2023-01-01T00:00:00Z
        ver: '1.0',
        iss: 'https://example.com',
        sub: 'custom-user123',
        aud: `${process.env.REACT_APP_AUTH_CLIENT_ID}`,
        iat: 1672531200, // 2023-01-01T00:00:00Z
        auth_time: 1672531200, // 2023-01-01T00:00:00Z
        oid: 'user-oid',
        name: 'Jane Doe',

        tfp: 'B2C_1_SignUpOrSignIn',
        at_hash: 'some-at-hash',
      },
      signature: 'custom-signature',
    });
  });

  it('should use default values for unspecified fields', () => {
    const partialToken = createIdentityToken({
      payload: {
        sub: 'partial-user123',
      },
    });

    expect(partialToken).toEqual({
      header: {
        alg: 'RS256',
        kid: 'some-key-id',
        typ: 'JWT',
      },
      payload: {
        exp: 1672534800, // 2023-01-01T01:00:00Z
        nbf: 1672531200, // 2023-01-01T00:00:00Z
        ver: '1.0',
        iss: 'https://example.com',
        sub: 'partial-user123',
        aud: `${process.env.REACT_APP_AUTH_CLIENT_ID}`,
        iat: 1672531200, // 2023-01-01T00:00:00Z
        auth_time: 1672531200, // 2023-01-01T00:00:00Z
        oid: 'user-oid',
        name: 'John Doe',
        tfp: 'B2C_1_SignUpOrSignIn',
        at_hash: 'some-at-hash',
      },
      signature: 'some-signature',

    });
  });

  // Reset the timer after all tests
  afterAll(() => {
    jest.useRealTimers();
  });
});

