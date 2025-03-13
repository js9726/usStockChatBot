import yahooFinance from 'yahoo-finance2';

export interface FinancialMetrics {
  return_on_equity: number | null;
  net_margin: number | null;
  operating_margin: number | null;
  revenue_growth: number | null;
  earnings_growth: number | null;
  book_value_growth: number | null;
  current_ratio: number | null;
  debt_to_equity: number | null;
  free_cash_flow_per_share: number | null;
  earnings_per_share: number | null;
  price_to_earnings_ratio: number | null;
  price_to_book_ratio: number | null;
  price_to_sales_ratio: number | null;
}

interface GetFinancialMetricsParams {
  ticker: string;
  endDate: string;
  period: string;
  limit: number;
}

export async function getFinalancialMetrics(params: GetFinancialMetricsParams): Promise<FinancialMetrics[]> {
  try {
    const { ticker } = params;
    console.log(`Fetching data for ticker: ${ticker}`);
    
    // Validate ticker format
    if (!ticker || typeof ticker !== 'string' || ticker.length === 0) {
      throw new Error('Invalid ticker symbol');
    }

    try {
      // Get quote data
      const quote = await yahooFinance.quote(ticker);
      if (!quote || !quote.symbol) {
        throw new Error(`No data found for ticker ${ticker}`);
      }

      console.log(`Found stock info for ${ticker}`);

      // Get financial statements
      const financials = await yahooFinance.quoteSummary(ticker, [
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
        'defaultKeyStatistics',
        'financialData'
      ]);

      if (!financials) {
        throw new Error(`Failed to fetch financial statements for ${ticker}`);
      }

      const {
        incomeStatementHistory,
        balanceSheetHistory,
        cashflowStatementHistory,
        defaultKeyStatistics,
        financialData
      } = financials;

      // Calculate metrics
      const metrics: FinancialMetrics = {
        // Profitability metrics
        return_on_equity: calculateReturnOnEquity(incomeStatementHistory, balanceSheetHistory),
        net_margin: calculateNetMargin(incomeStatementHistory),
        operating_margin: calculateOperatingMargin(incomeStatementHistory),

        // Growth metrics
        revenue_growth: calculateRevenueGrowth(incomeStatementHistory),
        earnings_growth: calculateEarningsGrowth(incomeStatementHistory),
        book_value_growth: calculateBookValueGrowth(balanceSheetHistory),

        // Financial health metrics
        current_ratio: calculateCurrentRatio(balanceSheetHistory),
        debt_to_equity: calculateDebtToEquity(balanceSheetHistory),
        free_cash_flow_per_share: calculateFreeCashFlowPerShare(cashflowStatementHistory, defaultKeyStatistics),
        earnings_per_share: financialData?.forwardEps || null,

        // Price ratios
        price_to_earnings_ratio: financialData?.forwardPE || null,
        price_to_book_ratio: financialData?.priceToBook || null,
        price_to_sales_ratio: financialData?.priceToSalesTrailing12Months || null
      };

      console.log(`Successfully calculated metrics for ${ticker}`);
      return [metrics];
    } catch (error) {
      console.error(`Error fetching data for ${ticker}:`, error);
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error in getFinalancialMetrics:', error);
    throw new Error(`Failed to fetch financial metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper functions to calculate financial metrics
function calculateReturnOnEquity(incomeStatement: any, balanceSheet: any): number | null {
  try {
    const netIncome = incomeStatement?.incomeStatementHistory?.[0]?.netIncome;
    const totalEquity = balanceSheet?.balanceSheetHistory?.[0]?.totalStockholderEquity;
    if (!netIncome || !totalEquity) return null;
    return (netIncome / totalEquity) * 100;
  } catch (error) {
    console.error('Error calculating ROE:', error);
    return null;
  }
}

function calculateNetMargin(incomeStatement: any): number | null {
  try {
    const netIncome = incomeStatement?.incomeStatementHistory?.[0]?.netIncome;
    const revenue = incomeStatement?.incomeStatementHistory?.[0]?.totalRevenue;
    if (!netIncome || !revenue) return null;
    return (netIncome / revenue) * 100;
  } catch (error) {
    console.error('Error calculating Net Margin:', error);
    return null;
  }
}

function calculateOperatingMargin(incomeStatement: any): number | null {
  try {
    const operatingIncome = incomeStatement?.incomeStatementHistory?.[0]?.operatingIncome;
    const revenue = incomeStatement?.incomeStatementHistory?.[0]?.totalRevenue;
    if (!operatingIncome || !revenue) return null;
    return (operatingIncome / revenue) * 100;
  } catch (error) {
    console.error('Error calculating Operating Margin:', error);
    return null;
  }
}

function calculateRevenueGrowth(incomeStatement: any): number | null {
  try {
    const currentRevenue = incomeStatement?.incomeStatementHistory?.[0]?.totalRevenue;
    const previousRevenue = incomeStatement?.incomeStatementHistory?.[1]?.totalRevenue;
    if (!currentRevenue || !previousRevenue) return null;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  } catch (error) {
    console.error('Error calculating Revenue Growth:', error);
    return null;
  }
}

function calculateEarningsGrowth(incomeStatement: any): number | null {
  try {
    const currentEarnings = incomeStatement?.incomeStatementHistory?.[0]?.netIncome;
    const previousEarnings = incomeStatement?.incomeStatementHistory?.[1]?.netIncome;
    if (!currentEarnings || !previousEarnings) return null;
    return ((currentEarnings - previousEarnings) / previousEarnings) * 100;
  } catch (error) {
    console.error('Error calculating Earnings Growth:', error);
    return null;
  }
}

function calculateBookValueGrowth(balanceSheet: any): number | null {
  try {
    const currentEquity = balanceSheet?.balanceSheetHistory?.[0]?.totalStockholderEquity;
    const previousEquity = balanceSheet?.balanceSheetHistory?.[1]?.totalStockholderEquity;
    if (!currentEquity || !previousEquity) return null;
    return ((currentEquity - previousEquity) / previousEquity) * 100;
  } catch (error) {
    console.error('Error calculating Book Value Growth:', error);
    return null;
  }
}

function calculateCurrentRatio(balanceSheet: any): number | null {
  try {
    const currentAssets = balanceSheet?.balanceSheetHistory?.[0]?.totalCurrentAssets;
    const currentLiabilities = balanceSheet?.balanceSheetHistory?.[0]?.totalCurrentLiabilities;
    if (!currentAssets || !currentLiabilities) return null;
    return currentAssets / currentLiabilities;
  } catch (error) {
    console.error('Error calculating Current Ratio:', error);
    return null;
  }
}

function calculateDebtToEquity(balanceSheet: any): number | null {
  try {
    const totalDebt = balanceSheet?.balanceSheetHistory?.[0]?.longTermDebt;
    const totalEquity = balanceSheet?.balanceSheetHistory?.[0]?.totalStockholderEquity;
    if (!totalDebt || !totalEquity) return null;
    return totalDebt / totalEquity;
  } catch (error) {
    console.error('Error calculating Debt to Equity:', error);
    return null;
  }
}

function calculateFreeCashFlowPerShare(cashFlow: any, stats: any): number | null {
  try {
    const freeCashFlow = cashFlow?.cashflowStatementHistory?.[0]?.freeCashFlow;
    const sharesOutstanding = stats?.sharesOutstanding;
    if (!freeCashFlow || !sharesOutstanding) return null;
    return freeCashFlow / sharesOutstanding;
  } catch (error) {
    console.error('Error calculating Free Cash Flow per Share:', error);
    return null;
  }
} 