declare module 'yfinance' {
  interface StockInfo {
    forwardEps?: number;
    forwardPE?: number;
    priceToBook?: number;
    priceToSalesTrailing12Months?: number;
    sharesOutstanding?: number;
  }

  interface StockData {
    loc: {
      [key: string]: {
        iloc: number[];
      };
    };
  }

  interface Stock {
    info(): Promise<StockInfo>;
    financials(): Promise<StockData>;
    balanceSheet(): Promise<StockData>;
    cashflow(): Promise<StockData>;
  }

  function yfinance(ticker: string): Stock;
  export = yfinance;
} 