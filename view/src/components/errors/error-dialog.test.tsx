import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { errorStore, State, ErrorDialog, generateIssueLink, initialState, reducer } from "../../context/errors/errors.provider";
import { Actions, Remove, RemoveAll, ToggleShow, ErrorIds } from "../../context/errors/errors.actions";
import { useCustomer } from "../../hooks/billing/use-customer-hook/use-customer";
import { useManageCb } from "../../hooks/billing/use-manage-cb";
import { useUpgradeCb } from "../../hooks/billing/use-upgrade-cb";
import { navigationStore, initialState as navInitialState } from "../../context/navigation/navigation.provider";
import { useLoginCb } from "../../hooks/auth/use-login-cb";
import ErrorDisplay from "./error-dialog";
import { createIdentityToken } from "../../test-utils/identity-factory.test";
import { IdentityToken } from "../../context/navigation/navigation.actions";
import { createCustomer } from "../../test-utils/customer-factory.test";
import userEvent from "@testing-library/user-event";

// Mocking required hooks and functions
jest.mock("../../hooks/billing/use-customer-hook/use-customer");
jest.mock("../../hooks/billing/use-manage-cb");
jest.mock("../../hooks/billing/use-upgrade-cb");
jest.mock("../../hooks/auth/use-login-cb");
jest.mock("../../context/errors/errors.provider", () => ({
  ...jest.requireActual("../../context/errors/errors.provider"),
  generateIssueLink: jest.fn(),
}));

// Mock window.open before all tests
const originalOpen = window.open;
beforeAll(() => {
  window.open = jest.fn();
});

afterAll(() => {
  window.open = originalOpen;
});

const mockUseCustomer = useCustomer as jest.MockedFunction<typeof useCustomer>;
const mockUseManageCb = useManageCb as jest.MockedFunction<typeof useManageCb>;
const mockUseUpgradeCb = useUpgradeCb as jest.MockedFunction<typeof useUpgradeCb>;
const mockUseLoginCb = useLoginCb as jest.MockedFunction<typeof useLoginCb>;
const mockGenerateIssueLink = generateIssueLink as jest.MockedFunction<typeof generateIssueLink>;

const setup = (initialState: State, identityToken: IdentityToken | null = createIdentityToken()) => {
  const mockNavDispatch = jest.fn();
  let dispatch: React.Dispatch<Actions>;
  const mockDispatch = jest.fn((action: Actions) => {
    // Call the real dispatch function
    dispatch(action);
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const [state, realDispatch] = React.useReducer(reducer,
      initialState
    );
    dispatch = realDispatch
    return (
      <errorStore.Provider value={{ state, dispatch: mockDispatch }}>
        <navigationStore.Provider value={{
          state: {...navInitialState, identityToken},
          dispatch: mockNavDispatch
        }}>
          {children}
        </navigationStore.Provider>
      </errorStore.Provider>
    );
  };

  return {
    ...render(<div data-testid="outside-element">
      <p>Outside Element</p> {/** needed to test click */}
      <TestWrapper><ErrorDisplay /></TestWrapper>
    </div>),
    mockDispatch,
  };
};

describe("ErrorDisplay", () => {
  beforeEach(() => {
    mockUseCustomer.mockReturnValue({ customer: undefined });
    mockUseManageCb.mockReturnValue(jest.fn());
    mockUseUpgradeCb.mockReturnValue(jest.fn());
    mockUseLoginCb.mockReturnValue(jest.fn());
    mockGenerateIssueLink.mockReturnValue("mockIssueLink");
  });

  it("should not render the dialog when there are no errors", () => {

    const { queryByRole } = setup({ ...initialState, errors: [], show: true });

    expect(queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog when there are errors and show is true", async () => {
    const errors: ErrorDialog[] = [
      { id: "1", header: "Error 1", body: "Error body" },
    ];
    const { findByRole, findByText } = setup({ ...initialState, errors, show: true });

    expect(await findByRole("dialog")).toBeInTheDocument();

    expect(await findByText("Error 1")).toBeInTheDocument();
    expect(await findByText("Error body")).toBeInTheDocument();
    expect(await findByText("#1")).toBeInTheDocument();
  });

  it("should call dispatch with Remove action when 'Dismiss' button is clicked", async () => {
    const errors: ErrorDialog[] = [
      { id: "1", header: "Error 1", body: "Error body" },
    ];
    const { getByRole, queryByRole, mockDispatch } = setup({ ...initialState, errors, show: true });

    fireEvent.click(getByRole("button", { name: /Dismiss/i }));

    expect(queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockDispatch).toHaveBeenCalledWith(ToggleShow(false))
  });

  it("should call dispatch with RemoveAll action when dialog is closed", async () => {
    const errors: ErrorDialog[] = [
      { id: "1", header: "Error 1", body: "Error body" },
    ];
    const { findByTestId, queryByRole, mockDispatch } = setup({ ...initialState, errors, show: true });

    userEvent.click(await findByTestId('outside-element')); // Simulate clicking outside the dialog

    expect(queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockDispatch).toHaveBeenCalledWith(RemoveAll());
    expect(mockDispatch).toHaveBeenCalledWith(ToggleShow(false));
  });

  it("should call generateIssueLink and dispatch Remove action when 'Submit Issue' button is clicked", () => {
    const errors: ErrorDialog[] = [
      { id: "1", header: "Error 1", body: "Error body" },
    ];

    const { getByRole, mockDispatch } = setup({ ...initialState, errors, show: true });

    fireEvent.click(getByRole("button", { name: /Submit Issue/i }));

    expect(mockGenerateIssueLink).toHaveBeenCalledWith(errors[0]);
    expect(window.open).toHaveBeenCalledWith("mockIssueLink", "_blank");
    expect(mockDispatch).toHaveBeenCalledWith(Remove("1"));
  });

  describe("should call appropriate callback based on error type and user state", () => {
    const errors: ErrorDialog[] = [
      { id: ErrorIds.CtaRequire, header: "Login Required", body: "Please login to continue" },
    ];

    it("Case 1: ErrorIds.CtaRequire with no identity token", async () => {
      mockUseCustomer.mockReturnValue({ customer: undefined });
      const { findByRole } = setup({ ...initialState, errors, show: true }, null);

      fireEvent.click( await findByRole("button", { name: /Login/i }));

      await waitFor(() => {
        const mock = mockUseLoginCb()
        expect(mock).toHaveBeenCalledTimes(1);
      })
    })
    it("Case 2: ErrorIds.CtaRequire with identity token and no customer", async () => {
      mockUseCustomer.mockReturnValue({ customer: undefined });
      const { findByRole, } = setup({ ...initialState, errors, show: true });

      fireEvent.click(await findByRole("button", { name: /Upgrade Account/i }));
      await waitFor(() => {
        const mock = mockUseUpgradeCb()
        expect(mock).toHaveBeenCalledTimes(1);
      })
    })
    it("Case 3: ErrorIds.CtaRequire with identity token and customer", async () => {
      mockUseCustomer.mockReturnValue({ customer: createCustomer() });
      const { findByRole, } = setup({ ...initialState, errors, show: true });

      fireEvent.click(await findByRole("button", { name: /Manage Subscription/i }));
      await waitFor(() => {
        const mock = mockUseManageCb()
        expect(mock).toHaveBeenCalledTimes(1);
      })
    })
  });

  it("should show error counter and additional message when there are multiple errors", async () => {
    const errors: ErrorDialog[] = [
      { id: "1", header: "Error 1", body: "Error body" },
      { id: "2", header: "Error 2", body: "Error body" },
    ];
    const { findByText } = setup({ ...initialState, errors, show: true});

    expect(await findByText("#2")).toBeInTheDocument();
    expect(await findByText("Click outside this model to dismiss all.")).toBeInTheDocument();
  });
});
