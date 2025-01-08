import React from "react";
import { navigationStore, initialState } from "../../../context/navigation/navigation.provider";
import { errorStore, initialState as errorInitialState } from "../../../context/errors/errors.provider";
import { mswServer } from "../../../setupTests";
import { rest } from "msw";
import { renderHook, waitFor } from "@testing-library/react";
import { useUpdateCustomerData } from "./use-update-customer-data";
import { RawCustomer } from "../../../context/navigation/navigation.actions";
import { Add } from "../../../context/errors/errors.actions";

const mockDispatch = jest.fn();
const mockErrorDispatch = jest.fn();

const MockProvider = ({ children }: {children: React.ReactNode}) => {
  return (
    <navigationStore.Provider value={{ state: initialState, dispatch: mockDispatch }}>
      <errorStore.Provider value={{ state: errorInitialState, dispatch: mockErrorDispatch }}>
        {children}
      </errorStore.Provider>
    </navigationStore.Provider>
  );
};

describe("useUpdateCustomerData", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  it("updates customer data successfully", async () => {
    const mockCustomerToken = "mockCustomerToken";
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/refresh`, (_, res, ctx) => res(ctx.json({customer_token: mockCustomerToken})))
    )
    const { result } = renderHook(() => useUpdateCustomerData(true), {
      wrapper: MockProvider,
    });

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith(RawCustomer(mockCustomerToken)))
    expect(result.current.updating).toBe(false); // Check if updating is set to false after the operation
  });

  it("handles non-ok fetch response", async () => {
    const errorMessage = "Fetch failed";
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/refresh`, (_, res, ctx) => res(
        ctx.status(500),
        ctx.text(errorMessage)))
    )
    const { result } = renderHook(() => useUpdateCustomerData(true), {
      wrapper: MockProvider,
    });

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: 'useUpdateCustomerData::updateCustomerData customer Data response not ok',
      body: errorMessage,
      id: expect.anything()
    })))

    expect(result.current.updating).toBe(false); // Check if updating is set to false after the operation
  });

  it("handles errors during fetch", async () => {
    const errorMessage = "Network Error";
    mswServer.use(
      rest.get(`${process.env.REACT_APP_API_URL}billing/refresh`, (_, res, ctx) => res.networkError(errorMessage))
    )
    const { result } = renderHook(() => useUpdateCustomerData(true), {
      wrapper: MockProvider,
    });

    await waitFor(() => expect(mockErrorDispatch).toHaveBeenCalledWith(Add({
      header: 'useUpdateCustomerData::Error updating customer data',
      body: 'Failed to fetch',
      id: expect.anything()
    })))

    expect(result.current.updating).toBe(false); // Check if updating is set to false after the operation
  });
});
