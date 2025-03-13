export function formatTickers(tickers: string[]): string[] {
  return tickers.map(ticker => ticker.replace('$', '').trim());
} 