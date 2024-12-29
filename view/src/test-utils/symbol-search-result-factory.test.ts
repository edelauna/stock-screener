import { SymbolSearchResult } from "../hooks/use-symbol-search";
import { NestedPartial } from "./identity-factory.test";

export const createSymbolSearchResult = (overrides: NestedPartial<SymbolSearchResult> = {}): SymbolSearchResult => {
  const defaultSymbolSearchResult: SymbolSearchResult = {
    "1. symbol": "AAPL",
    "2. name": "Apple Inc.",
    "3. type": "Equity",
    "4. region": "United States",
    "5. marketOpen": "09:30",
    "6. marketClose": "16:00",
    "7. timezone": "America/New_York",
    "8. currency": "USD",
    "9. matchScore": "1.0000",
  };

  return { ...defaultSymbolSearchResult, ...overrides };
};

describe('createSymbolSearchResult', () => {
  it('should create a SymbolSearchResult with default values', () => {
    const result = createSymbolSearchResult();

    expect(result).toEqual({
      "1. symbol": "AAPL",
      "2. name": "Apple Inc.",
      "3. type": "Equity",
      "4. region": "United States",
      "5. marketOpen": "09:30",
      "6. marketClose": "16:00",
      "7. timezone": "America/New_York",
      "8. currency": "USD",
      "9. matchScore": "1.0000",
    });
  });

  it('should create a SymbolSearchResult with custom values', () => {
    const customResult = createSymbolSearchResult({
      "1. symbol": "MSFT",
      "2. name": "Microsoft Corporation",
      "9. matchScore": "0.9500",
    });

    expect(customResult).toEqual({
      "1. symbol": "MSFT",
      "2. name": "Microsoft Corporation",
      "3. type": "Equity",
      "4. region": "United States",
      "5. marketOpen": "09:30",
      "6. marketClose": "16:00",
      "7. timezone": "America/New_York",
      "8. currency": "USD",
      "9. matchScore": "0.9500",
    });
  });

  it('should use default values for unspecified fields', () => {

    const partialResult = createSymbolSearchResult({
      "1. symbol": "GOOGL",
    });

    expect(partialResult).toEqual({
      "1. symbol": "GOOGL",
      "2. name": "Apple Inc.",
      "3. type": "Equity",
      "4. region": "United States",
      "5. marketOpen": "09:30",
      "6. marketClose": "16:00",
      "7. timezone": "America/New_York",
      "8. currency": "USD",
      "9. matchScore": "1.0000",
    });
  });
});

describe('symbolSearchResults', () => {

  const apple = createSymbolSearchResult();
  const microsoft = createSymbolSearchResult({
    "1. symbol": "MSFT",
    "2. name": "Microsoft Corporation",
  });

  const symbolSearchResults: SymbolSearchResult[] = [
    apple,
    microsoft,
    createSymbolSearchResult({
      "1. symbol": "GOOGL",
      "2. name": "Alphabet Inc.",
    }),
    createSymbolSearchResult({
      "1. symbol": "AMZN",
      "2. name": "Amazon.com, Inc.",
    }),
  ];

  it('should contain the correct number of SymbolSearchResult objects', () => {
    expect(symbolSearchResults).toHaveLength(4);
  });

  it('should contain the correct SymbolSearchResult objects', () => {
    expect(symbolSearchResults[0]).toEqual(apple);
    expect(symbolSearchResults[1]).toEqual(microsoft);
    expect(symbolSearchResults[2]).toEqual(createSymbolSearchResult({
      "1. symbol": "GOOGL",
      "2. name": "Alphabet Inc.",
    }));

    expect(symbolSearchResults[3]).toEqual(createSymbolSearchResult({
      "1. symbol": "AMZN",
      "2. name": "Amazon.com, Inc.",
    }));
  });

  it('should have unique symbols in the array', () => {
    const symbols = symbolSearchResults.map(result => result["1. symbol"]);
    expect(new Set(symbols).size).toEqual(symbols.length);
  });
});
