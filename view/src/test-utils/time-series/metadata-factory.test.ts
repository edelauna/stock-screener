import { MetaData } from "../../hooks/use-time-series-daily/use-time-series-daily";

export const createMetaData = (overrides?: Partial<MetaData>): MetaData => {
  return {
    symbol: "AAPL",
    "1. Information": "Daily Time Series",
    "2. Symbol": overrides?.symbol ? overrides.symbol : "AAPL",
    "3. Last Refreshed": new Date().toLocaleDateString(),
    "4. Output Size": "Full size",
    "5. Time Zone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...overrides
  };
};

describe('createMetaData', () => {
  it('should create a MetaData object with the provided values', () => {
    const symbol = 'AAPL';
    const lastRefreshed = '2023-10-01';
    const timeZone = 'US/Eastern';

    const result: MetaData = createMetaData({
      symbol,
      "3. Last Refreshed": lastRefreshed,
      "5. Time Zone": timeZone
    });

    expect(result).toEqual({
      symbol: symbol,
      "1. Information": "Daily Time Series",
      "2. Symbol": symbol,
      "3. Last Refreshed": lastRefreshed,
      "4. Output Size": "Full size",
      "5. Time Zone": timeZone,
    });
  });

  it('should use default values for "1. Information" and "4. Output Size"', () => {
    const symbol = 'MSFT';
    const lastRefreshed = '2023-10-02';

    const timeZone = 'US/Pacific';

    const result: MetaData = createMetaData({
      symbol,
      "3. Last Refreshed": lastRefreshed,
      "5. Time Zone": timeZone
    });

    expect(result["1. Information"]).toBe("Daily Time Series");
    expect(result["4. Output Size"]).toBe("Full size");
  });

  it('should correctly set the symbol in both "symbol" and "2. Symbol" fields', () => {
    const symbol = 'GOOGL';
    const lastRefreshed = '2023-10-03';
    const timeZone = 'US/Central';

    const result: MetaData = createMetaData({
      symbol,
      "3. Last Refreshed": lastRefreshed,
      "5. Time Zone": timeZone
    });

    expect(result.symbol).toBe(symbol);
    expect(result["2. Symbol"]).toBe(symbol);
  });
});
