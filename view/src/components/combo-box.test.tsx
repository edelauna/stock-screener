import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ComboBox from './combo-box'; // Adjust the import path as needed
import { initialState, store } from '../context/symbol-search/symbol-search.provider';
import { UpdateActiveSymbol } from '../context/symbol-search/symbol-search.actions';
import { useSymbolSearch } from '../hooks/use-symbol-search';
import { createSymbolSearchResult } from '../test-utils/symbol-search-result-factory.test';
import userEvent from '@testing-library/user-event';

interface Children {
  children: React.ReactNode
}

jest.mock('../hooks/use-symbol-search', () => ({
  useSymbolSearch: jest.fn(),
}));

const mockUseSymbolSearch = useSymbolSearch as jest.MockedFunction<typeof useSymbolSearch>;
const mockDispatch = jest.fn();

const TestWrapper = ({ children }: Children) => (
  <store.Provider value={{ state: { ...initialState, activeSymbol: createSymbolSearchResult() }, dispatch: mockDispatch }}>
    {children}
  </store.Provider>
);

describe('ComboBox', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockUseSymbolSearch.mockReturnValue({ data: [], loading: false });
  });

  it('renders the combobox input and button', () => {
    render(<TestWrapper><ComboBox /></TestWrapper>);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays the magnifying glass icon when no data is available', () => {
    render(<TestWrapper><ComboBox /></TestWrapper>);

    expect(screen.getByTestId('MagnifyingGlassIcon')).toBeInTheDocument();
    expect(screen.queryByTestId('ChevronDownIcon')).not.toBeInTheDocument();
  });

  it('displays the chevron down icon when data is available', () => {
    mockUseSymbolSearch.mockReturnValue({ data: [createSymbolSearchResult()], loading: false });
    render(<TestWrapper><ComboBox /></TestWrapper>);

    expect(screen.getByTestId('ChevronDownIcon')).toBeInTheDocument();

    expect(screen.queryByTestId('MagnifyingGlassIcon')).not.toBeInTheDocument();
  });

  it('updates the query state when typing in the input', () => {
    render(<TestWrapper><ComboBox /></TestWrapper>);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'AAPL' } });

    expect(input).toHaveValue('AAPL');
  });

  it('displays options when data is available', async () => {
    const mockData = [
      createSymbolSearchResult(),
      createSymbolSearchResult({ '1. symbol': 'MSFT', '2. name': 'Microsoft Corporation' }),
    ];
    mockUseSymbolSearch.mockReturnValue({ data: mockData, loading: false });

    render(<TestWrapper><ComboBox /></TestWrapper>);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });
    expect(await screen.findByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    expect(await screen.findByText('Microsoft Corporation (MSFT)')).toBeInTheDocument();
  });

  it('selects an option and updates the context', async () => {
    const mockData = [
      createSymbolSearchResult(),
    ];
    mockUseSymbolSearch.mockReturnValue({ data: mockData, loading: false });

    render(<TestWrapper><ComboBox /></TestWrapper>);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'A' } });

    expect(await screen.findByText('Apple Inc. (AAPL)')).toBeInTheDocument();

    userEvent.click(await screen.findByText('Apple Inc. (AAPL)'));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(UpdateActiveSymbol(mockData[0]));
    });
  });
});
