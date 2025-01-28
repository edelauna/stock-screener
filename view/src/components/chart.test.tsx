import React from 'react';
import { render, screen } from '@testing-library/react';
import { initialState, store as symbolStore } from '../context/symbol-search/symbol-search.provider';
import { useTimeSeriesDaily } from '../hooks/use-time-series-daily/use-time-series-daily';
import { generateRSIannotations, generateTimeDailySeries, limitXAxis } from '../utils/chart';
import { createSymbolSearchResult } from '../test-utils/symbol-search-result-factory.test';
import { SymbolSearchResult } from '../hooks/use-symbol-search';
import { createMetaData } from '../test-utils/time-series/metadata-factory.test';
import { Chart } from './chart';
import { createTimeSeriesDayData } from '../test-utils/time-series/time-series-daily-factory.test';

jest.mock('../hooks/use-time-series-daily/use-time-series-daily', () => ({
  useTimeSeriesDaily: jest.fn(),
}));

jest.mock('react-apexcharts', () => ({
  __esModule: true,
  //todo - mock this out more completely to test callback
  default: () => {
    return <div data-testid="apex-charts-mocked" />
  }
}));

jest.mock('../utils/chart', () => ({
  generateRSIannotations: jest.fn(() => [{}, 50]),
  generateTimeDailySeries: jest.fn(() => [[1, 2], [3, 4]]),
  limitXAxis: jest.fn((min, max) => [min, max]),
}));

const mockUseTimeSeriesDaily = useTimeSeriesDaily as jest.MockedFunction<typeof useTimeSeriesDaily>;
const mockGenerateRSIannotations = generateRSIannotations as jest.MockedFunction<typeof generateRSIannotations>;
const mockGenerateTimeDailySeries = generateTimeDailySeries as jest.MockedFunction<typeof generateTimeDailySeries>;
const mockLimitXAxis = limitXAxis as jest.MockedFunction<typeof limitXAxis>;

interface TestWrapperProps {
  children: React.ReactNode,
  activeSymbol: SymbolSearchResult
}

const TestWrapper = ({ children, activeSymbol = createSymbolSearchResult() }: TestWrapperProps) => (
  <symbolStore.Provider value={{ state: { ...initialState, activeSymbol }, dispatch: jest.fn() }}>
    {children}
  </symbolStore.Provider>
);

describe('Chart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeSeriesDaily.mockReturnValue({ data: [], metadata: createMetaData(), loading: true, currentFetchRef: '' });
    mockGenerateRSIannotations.mockReturnValue([{}, 50]);
    mockGenerateTimeDailySeries.mockReturnValue([[1, 2], [3, 4]]);
    mockLimitXAxis.mockImplementation((min, max) => [min, max]);
  });

  it('renders the chart components', () => {
    const activeSymbol = {
      '1. symbol': 'AAPL',
      '2. name': 'Apple Inc.',
      '8. currency': 'USD',
    };
    mockUseTimeSeriesDaily.mockReturnValue({ data: [], metadata: createMetaData({symbol: 'AAPL'}), loading: false, currentFetchRef: '' });

    render(<TestWrapper activeSymbol={createSymbolSearchResult(activeSymbol)}><Chart /></TestWrapper>);

    expect(screen.getAllByTestId('apex-charts-mocked')).toHaveLength(2);
  });

  it('updates the series when data is available', () => {

    const activeSymbol = {
      '1. symbol': 'AAPL',
      '2. name': 'Apple Inc.',
      '8. currency': 'USD',
    };
    const mockData = [createTimeSeriesDayData({ '4. close': '100' }), createTimeSeriesDayData({ '4. close': '105' })];
    mockUseTimeSeriesDaily.mockReturnValue({ data: mockData, metadata: createMetaData(), loading: false, currentFetchRef: '' });

    render(<TestWrapper activeSymbol={createSymbolSearchResult(activeSymbol)}><Chart /></TestWrapper>);

    expect(mockGenerateTimeDailySeries).toHaveBeenCalledWith(mockData);
  });

  it('displays the loading indicator when data is loading', () => {
    const activeSymbol = {
      '1. symbol': 'AAPL',
      '2. name': 'Apple Inc.',
      '8. currency': 'USD',
    };
    mockUseTimeSeriesDaily.mockReturnValue({ data: [], metadata: createMetaData(), loading: true, currentFetchRef: '' });

    render(<TestWrapper activeSymbol={createSymbolSearchResult(activeSymbol)}><Chart /></TestWrapper>);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});
