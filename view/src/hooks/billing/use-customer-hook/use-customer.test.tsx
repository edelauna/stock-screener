import React from "react";
import { initialState, navigationStore, State } from "../../../context/navigation/navigation.provider";
import { useVerifyCB } from "./use-callbacks/use-verify-cb";
import { useLocalKey } from "../../auth/use-keys";
import { renderHook, waitFor } from "@testing-library/react";
import { useCustomer } from "./use-customer";
import { RawCustomer } from "../../../context/navigation/navigation.actions";

// Mocks
jest.mock("../../auth/use-keys");
jest.mock("./use-callbacks/use-verify-cb"); // Mock the verify callback

const mockDispatch = jest.fn();

interface MockProviderProps {
  children: React.ReactNode,
  state: Partial<State>
}

const MockProvider = ({ children, state }: MockProviderProps) => {
  return (
    <navigationStore.Provider value={{ state: {...initialState, ...state}, dispatch: mockDispatch }}>
      {children}
    </navigationStore.Provider>
  );
};

let mockLocalKey: {e: string, n: string, kty: string}

describe("useCustomer", () => {
  beforeAll(async () => {
    // Define dummy local key for testing
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
    mockLocalKey = await crypto.subtle.exportKey('jwk', cryptoKeys.publicKey) as {e: string, n: string, kty: string}
  })
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it("sets customer when verifyCB returns valid payload", async () => {
    // Mocking the verify callback
    (useVerifyCB as jest.Mock).mockReturnValue(jest.fn(async () => ({
      isValid: true,
      payload: { oid: "123", customer: { id: "cust_1", object: "customer", metadata: {}, subscriptions: [] } },
    })));

    (useLocalKey as jest.Mock).mockReturnValue({ localKey: mockLocalKey });

    const { result } = renderHook(() => useCustomer(), {
      wrapper: ({ children }) => <MockProvider state={{ rawCustomerToken: "testToken", rawIdentityToken: "" }}>{children}</MockProvider>,
    });

    await waitFor(()=> expect(result.current.customer).toEqual({ oid: "123", customer: { id: "cust_1", object: "customer", metadata: {}, subscriptions: [] } }))
  });

  it("dispatches RawCustomer action and sets customer to undefined if rawIdentityToken is empty", async () => {
    (useVerifyCB as jest.Mock).mockReturnValue(jest.fn(async () => ({
      isValid: false,
      payload: null,
    })));

    (useLocalKey as jest.Mock).mockReturnValue({ localKey: mockLocalKey });

    const { result } = renderHook(() => useCustomer(), {
      wrapper: ({ children }) => <MockProvider state={{ rawCustomerToken: "testToken", rawIdentityToken: "" }}>{children}</MockProvider>,
    });

    expect(mockDispatch).toHaveBeenCalledWith(RawCustomer(''));
    expect(result.current.customer).toBeUndefined();
  });
});
