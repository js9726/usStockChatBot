export interface Progress {
  updateStatus: (agent: string, ticker: string, status: string) => void;
}

export const progress: Progress = {
  updateStatus: (agent: string, ticker: string, status: string) => {
    console.log(`${agent}: ${ticker} - ${status}`);
  }
}; 