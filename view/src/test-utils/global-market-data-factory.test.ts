import { GlobalMarketData } from "../context/market-status/market-status.provider";

export const createGlobalMarketData = (overrides?: Partial<GlobalMarketData>): GlobalMarketData => {
  return {
    "market_type": "Equity",
    "region": "United States",
    "primary_exchanges": "NASDAQ, NYSE, AMEX, BATS",
    "local_open": "09:30",
    "local_close": "16:15",
    "current_status": "closed",
    "notes": "",
    ...overrides
  };
};

describe('createGlobalMarketData', () => {

  it('should create a GlobalMarketData object with the provided values', () => {
    const marketType = 'Stock';
    const region = 'US';
    const primaryExchanges = 'NYSE, NASDAQ';
    const localOpen = '09:30';
    const localClose = '16:00';
    const currentStatus = 'Open';
    const notes = 'Regular trading hours';

    const result: GlobalMarketData = createGlobalMarketData({
      market_type: marketType,
      region,
      primary_exchanges: primaryExchanges,
      local_open: localOpen,
      local_close: localClose,
      current_status: currentStatus,
      notes
    });

    expect(result).toEqual({
      "market_type": marketType,
      "region": region,
      "primary_exchanges": primaryExchanges,
      "local_open": localOpen,
      "local_close": localClose,
      "current_status": currentStatus,
      "notes": notes,
    });
  });

  it('should correctly set each field with the provided values', () => {
    const marketType = 'Forex';
    const region = 'Global';
    const primaryExchanges = 'Various';
    const localOpen = '24/7';
    const localClose = '24/7';
    const currentStatus = 'Open';
    const notes = 'Operates 24 hours a day, 7 days a week';

    const result: GlobalMarketData = createGlobalMarketData({
      market_type: marketType,
      region,
      primary_exchanges: primaryExchanges,
      local_open: localOpen,
      local_close: localClose,
      current_status: currentStatus,
      notes
    });

    expect(result["market_type"]).toBe(marketType);
    expect(result["region"]).toBe(region);
    expect(result["primary_exchanges"]).toBe(primaryExchanges);
    expect(result["local_open"]).toBe(localOpen);
    expect(result["local_close"]).toBe(localClose);
    expect(result["current_status"]).toBe(currentStatus);
    expect(result["notes"]).toBe(notes);
  });
});
