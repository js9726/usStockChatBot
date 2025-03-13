declare module 'yahoo-finance2' {
  interface QuoteResponse {
    symbol: string;
    regularMarketPrice: number;
    forwardEps?: number;
    forwardPE?: number;
    priceToBook?: number;
    sharesOutstanding?: number;
  }

  interface FinancialStatement {
    incomeStatementHistory: {
      totalRevenue: number;
      netIncome: number;
      operatingIncome: number;
    }[];
    balanceSheetHistory: {
      totalAssets: number;
      totalCurrentAssets: number;
      totalCurrentLiabilities: number;
      totalStockholderEquity: number;
      longTermDebt: number;
    }[];
    cashflowStatementHistory: {
      freeCashFlow: number;
    }[];
  }

  interface QuoteSummaryOptions {
    modules: string[];
  }

  interface YahooFinance {
    quote(symbol: string): Promise<QuoteResponse>;
    quoteSummary(symbol: string, options: QuoteSummaryOptions): Promise<any>;
  }

  const yahooFinance: YahooFinance;
  export default yahooFinance;
} 