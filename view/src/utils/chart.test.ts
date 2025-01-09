import { TimeSeriesDailyRow } from "../context/db/db";
import { createTimeSeriesDayData } from "../test-utils/time-series/time-series-daily-factory.test";
import { generateRSIannotations, generateTimeDailySeries, limitXAxis } from "./chart";

// Mock data for TimeSeriesDailyRow
const mockData: TimeSeriesDailyRow[] = [
  createTimeSeriesDayData({ date: '2023-01-01', '5. adjusted close': '100.00' }),
  createTimeSeriesDayData({ date: '2023-01-02', '5. adjusted close': '101.50' }),
  createTimeSeriesDayData({ date: '2023-01-03', '5. adjusted close': '102.75' }),
];

describe('generateTimeDailySeries', () => {
  it('should convert TimeSeriesDailyRow to Series format', () => {
    const result = generateTimeDailySeries(mockData);
    expect(result).toEqual([
      [new Date('2023-01-01').getTime(), 100],
      [new Date('2023-01-02').getTime(), 101.5],
      [new Date('2023-01-03').getTime(), 102.75],
    ]);
  });

  it('should round the adjusted close to two decimal places', () => {
    const customData: TimeSeriesDailyRow[] = [
      createTimeSeriesDayData({ date: '2023-01-01', '5. adjusted close': '100.12345' }),
    ];
    const result = generateTimeDailySeries(customData);
    expect(result[0][1]).toBe(100.12);
  });
});

describe('limitXAxis', () => {
  it('should return the input if max is within 5 years of min', () => {
    const min = 0;
    const max = 157784760000; // 5 years in milliseconds
    const result = limitXAxis(min, max);
    expect(result).toEqual([min, max]);
  });

  it('should limit max to 5 years from min if max exceeds that', () => {
    const min = 0;
    const max = 157784760000 * 2; // 10 years in milliseconds
    const result = limitXAxis(min, max);
    expect(result).toEqual([min, 157788000000]);
  });

  it('should handle negative min values correctly', () => {
    const min = -157784760000; // -5 years in milliseconds
    const max = 0;
    const result = limitXAxis(min, max);
    expect(result).toEqual([min, 0]);
  });
});

describe('generateRSIannotations', () => {
  const mockSeries: number[][] = [
    [1672531200000, 100], // 2023-01-01
    [1672617600000, 101], // 2023-01-02
    [1672704000000, 102], // 2023-01-03
    [1672790400000, 103], // 2023-01-04
    [1672876800000, 104], // 2023-01-05
    [1672963200000, 105], // 2023-01-06
  ];

  it('should generate RSI annotations and return RSI value', () => {
    const result = generateRSIannotations(mockSeries.reverse(), 3);
    expect(result).toHaveLength(2);
    expect(result[0]).not.toBeNull();
    expect(result[0]?.xaxis).toHaveLength(1);
    expect(result[1]).toBeCloseTo(100); // Expected RSI value for the given data
  });

  it('should return null when no annotations are generated', () => {
    const flatSeries: number[][] = [
      [1672531200000, 100],
      [1672617600000, 100],
      [1672704000000, 100],
      [1672790400000, 100],
      [1672876800000, 100],
      [1672963200000, 100],
    ];
    const result = generateRSIannotations(flatSeries.reverse(), 3);
    expect(result).toEqual([null, null]);
  });

  it('should handle edge cases with short series', () => {
    const shortSeries: number[][] = [
      [1672531200000, 100],
      [1672617600000, 101],
    ];
    const result = generateRSIannotations(shortSeries.reverse(), 3);
    expect(result).toEqual([null, null]);
  });
});