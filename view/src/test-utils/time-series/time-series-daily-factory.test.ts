import { data } from "react-router";
import { TimeSeriesDailyRow } from "../../context/db/db";

export const createTimeSeriesDayData = (overrides?: Partial<TimeSeriesDailyRow>): TimeSeriesDailyRow => {
  return {
    id: "1",
    date: new Date().toLocaleDateString(),
    symbol: "AAPL",
    "1. open": "100",
    "2. high": "110",
    "3. low": "90",
    "4. close": "100",
    "5. adjusted close": "100",
    "6. volume": "100",
    "7. dividend amount": "0",
    "8. split coefficient": "0",
    ...overrides,
  };
};

describe('createTimeSeriesDayData', () => {
  it('should create a TimeSeriesDayData object with the provided values', () => {
    const open = '100.00';
    const high = '105.00';
    const low = '95.00';
    const close = '102.00';
    const adjustedClose = '101.50';
    const volume = '1000000';
    const dividendAmount = '0.00';
    const splitCoefficient = '1.00';

    const result: TimeSeriesDailyRow = createTimeSeriesDayData({
      "1. open": open,
      "2. high": high,
      "3. low": low,
      "4. close": close,
      "5. adjusted close": adjustedClose,
      "6. volume": volume,
      "7. dividend amount": dividendAmount,
      "8. split coefficient": splitCoefficient
    });

    expect(result).toEqual({
      date: new Date().toLocaleDateString(),
      id: "1",
      symbol: "AAPL",
      "1. open": open,
      "2. high": high,
      "3. low": low,
      "4. close": close,
      "5. adjusted close": adjustedClose,
      "6. volume": volume,
      "7. dividend amount": dividendAmount,
      "8. split coefficient": splitCoefficient,
    });
  });

  it('should correctly set each field with the provided values', () => {
    const open = '110.00';
    const high = '115.00';
    const low = '105.00';
    const close = '112.00';
    const adjustedClose = '111.50';
    const volume = '1500000';
    const dividendAmount = '0.50';
    const splitCoefficient = '2.00';

    const result: TimeSeriesDailyRow = createTimeSeriesDayData({
      "1. open": open,
      "2. high": high,
      "3. low": low,
      "4. close": close,
      "5. adjusted close": adjustedClose,
      "6. volume": volume,
      "7. dividend amount": dividendAmount,
      "8. split coefficient": splitCoefficient
    });

    expect(result["1. open"]).toBe(open);
    expect(result["2. high"]).toBe(high);
    expect(result["3. low"]).toBe(low);
    expect(result["4. close"]).toBe(close);
    expect(result["5. adjusted close"]).toBe(adjustedClose);
    expect(result["6. volume"]).toBe(volume);
    expect(result["7. dividend amount"]).toBe(dividendAmount);
    expect(result["8. split coefficient"]).toBe(splitCoefficient);
  });
});
