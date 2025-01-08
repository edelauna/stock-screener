import { render, screen } from '@testing-library/react';
import { initialState, store } from '../context/symbol-search/symbol-search.provider';
import { createSymbolSearchResult } from '../test-utils/symbol-search-result-factory.test';
import { Header } from './header';

interface Children {
  children: React.ReactNode
}

const TestWrapper = ({ children }: Children) => (
  <store.Provider value={{ state: initialState, dispatch: jest.fn() }}>
    {children}
  </store.Provider>
);

describe('Header', () => {
  it('renders the header with "Search" text when no active symbol is set', () => {
    render(<TestWrapper><Header /></TestWrapper>);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Search');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders the header with the active symbol name when set', () => {

    const activeSymbol = createSymbolSearchResult({ '2. name': 'Apple Inc.' });
    const testState = { ...initialState, activeSymbol };

    render(
      <store.Provider value={{ state: testState, dispatch: jest.fn() }}>
        <Header />
      </store.Provider>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Apple Inc.');
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
