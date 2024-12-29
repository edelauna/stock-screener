import React from "react";
import { initialState, navigationStore, State } from "../../context/navigation/navigation.provider";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useLoginCb } from "./use-login-cb";
import { Redirect } from "../../context/navigation/navigation.actions";
import { createIdentityToken } from "../../test-utils/identity-factory.test";

const mockDispatch = jest.fn()

interface MockProviderProps {
  children: React.ReactNode,
  state: Partial<State>
}
const MockProvider = ({ children, state }: MockProviderProps) => {
  return (
    <navigationStore.Provider value={{ state: {...initialState, ...state}, dispatch: mockDispatch }}>
      {children}
    </navigationStore.Provider>
  )
}

describe("useLoginCb", () => {
  const originalLocation = window.location

  beforeEach(() => {
    const mockLocation = {
      href: "",
    };
    // Apply the mock location to window
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
  });

  afterEach(() => {
    window.location = originalLocation; // Restore original location after tests
  });
  it("redirects to authUrl if identityToken is not present", async () => {
    const {result} = renderHook(() => useLoginCb(), {
      wrapper: ({ children }) =>
        <MockProvider state={{ authUrl: "https://auth.url", identityToken: null }}>
          {children}
        </MockProvider>
    });
    result.current()

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(Redirect(true)))
    expect(window.location.href).toBe("https://auth.url")
  });

  it("does not redirect if identityToken is present", async () => {
    const { result } = renderHook(() => useLoginCb(), {
      wrapper: ({ children }) =>
        <MockProvider state={{ authUrl: "https://auth.url", identityToken: createIdentityToken() }}>
          {children}
        </MockProvider>
    });

    act(() => {
      result.current();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(window.location.href).toBe("")
  });

  it("does not redirect if authUrl is not present", () => {
    const { result } = renderHook(() => useLoginCb(), {
      wrapper: ({ children }) =>
        <MockProvider state={{ authUrl: null, identityToken: null }}>
          {children}
        </MockProvider>
    });

    act(() => {
      result.current();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(window.location.href).toBe(""); // Remains unchanged
  });
});
