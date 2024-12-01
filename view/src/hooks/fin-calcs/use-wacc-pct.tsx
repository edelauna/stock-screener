
export const useWACCpct = () => {
  /**
   * wacc = (e / v * rE) + [d / v * rD * (1 - tC) ]
   * e = price * commonStockSharesOutstanding (balance-sheet)
   * d = debtLongtermAndShorttermCombinedAmount (balance-sheet)
   * v = e + d
   * rE = riskFreeRate + beta * (riskFreeRate - expectedReturnOfMarket)
   * riskFreeRate = simple return of from TREASURY_YIELD api
   * expectedReturnOfMarket = simple return of SPY over period
   * beta = covariance(stockLogReturns, marketLogreturns) / variance(stockLogReturns)
   * xLogReturns = Math.log(price_n / price_{n-1})
   * covariance = (||x|| - xMean) * (||y|| - yMean) / N
   * variance = (||x|| - xMean)^2 / N
   * rD = debtLongtermAndShorttermCombinedAmount (balance-sheet)
   * tC = incomeTaxExpense / incomeBeforeTax (effectiveTax) (income-statment)
   * 
   * roic = nopat / investedCapital
   * nopat = ebit - (ebit * tC) (income-statement)
   * investedCapital = nonCashWorkingCapital + fixedAssets
   * nonCashWorkingCapital = workingCapital - cashAndShortTermInvestments (balance-sheet)
   * workingCapital = totalCurrentAssets - totalLiabilities (balance-sheet)
   * fixedAssets = propertyPlantEquipment  - accumulatedDepreciationAmortizationPPE (balance-sheet)
   * 
   * roic > wacc ? buy : sell
   */
}