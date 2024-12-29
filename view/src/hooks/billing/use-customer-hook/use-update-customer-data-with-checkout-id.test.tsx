import React from "react";
import { useNavigate } from "react-router";
import { navigationStore, type State as NavState, initialState as navInitialState } from "../../../context/navigation/navigation.provider";
import { State, errorStore, initialState } from "../../../context/errors/errors.provider";
import { mswServer } from "../../../setupTests";
import { rest } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { useUpdateCustomerDataWithCheckoutId } from "./use-update-customer-data-with-checkout-id";
import { RawCustomer, Redirect } from "../../../context/navigation/navigation.actions";
import { Add } from "../../../context/errors/errors.actions";

// Mocking dependencies
jest.mock("react-router", () => ({
  useNavigate: jest.fn()
}));

const mockDispatch = jest.fn();
const mockErrorDispatch = jest.fn();

interface MockProviderProps {
  children: React.ReactNode,
  navigationState: Partial<NavState>,
  errorState: Partial<State>
}
const MockProvider = ({ children, navigationState, errorState }: MockProviderProps) => {
  return (
    <navigationStore.Provider value={{ state: {...navInitialState, ...navigationState}, dispatch: mockDispatch }}>
      <errorStore.Provider value={{ state: {...initialState, ...errorState}, dispatch: mockErrorDispatch }}>
        {children}
      </errorStore.Provider>
    </navigationStore.Provider>
  );
};

describe("useUpdateCustomerDataWithCheckoutId", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it("fetches customer data successfully and updates state", async () => {
    const checkoutId = "testCheckoutId";
    const mockCustomerToken = "mockCustomerToken";
    const mockResponse = { customer_token: mockCustomerToken };
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/redirected`, (_, res, ctx) => res(ctx.json(mockResponse)))
    )

    const mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate); // Mock the useNavigate return

    renderHook(() => useUpdateCustomerDataWithCheckoutId(checkoutId), {
      wrapper: ({ children }) => <MockProvider navigationState={{ rawCustomerToken: "", rawIdentityToken: "" }} errorState={{}}>{children}</MockProvider>,
    });

    await waitFor(() =>     expect(mockDispatch).toHaveBeenCalledWith(RawCustomer(mockCustomerToken))  )
    expect(mockNavigate).toHaveBeenCalledWith("/"); // Check if navigation happened
    expect(mockDispatch).toHaveBeenCalledWith(Redirect(false)); // Check if Redirect(false) was dispatched
  });

  it("handles errors when fetch response is not ok", async () => {
    const checkoutId = "testCheckoutId";
    const errorMessage = "Error fetching data";

    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/redirected`, (_, res, ctx) => res(
        ctx.status(500),
        ctx.text(errorMessage)))
    )

    renderHook(() => useUpdateCustomerDataWithCheckoutId(checkoutId), {
      wrapper: ({ children }) => <MockProvider navigationState={{ rawCustomerToken: "", rawIdentityToken: "" }} errorState={{}}>{children}</MockProvider>,
    });

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: 'useCustomer::Genrate customer Data response not ok',
      body: errorMessage,
      id: expect.anything()
    })))
    expect(mockDispatch).toHaveBeenCalledWith(Redirect(false)); // Check if Redirect(false) was dispatched
  });

  it("handles errors during fetch", async () => {
    const checkoutId = "testCheckoutId";
    const errorMessage = "Network Error";

    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/redirected`, (_, res, ctx) => res.networkError(errorMessage))
    )

    renderHook(() => useUpdateCustomerDataWithCheckoutId(checkoutId), {
      wrapper: ({ children }) => <MockProvider navigationState={{ rawCustomerToken: "", rawIdentityToken: "" }} errorState={{}}>{children}</MockProvider>,
    });

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: 'useCustomer::Error updating customer data',
      body: 'Failed to fetch',
      id: expect.anything()
    })))
    expect(mockDispatch).toHaveBeenCalledWith(Redirect(false)); // Check if Redirect(false) was dispatched
  });
});
