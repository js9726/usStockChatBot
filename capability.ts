import { HumanMessage } from 'langchain/schema';
import { Progress } from './utils/progress';
import { FinancialMetrics, getFinalancialMetrics } from './tools/api';

interface AgentState {
  data: {
    end_date: string;
    tickers: string[];
    analyst_signals: {
      [key: string]: any;
    };
  };
  metadata: {
    show_reasoning: boolean;
  };
}

interface SignalReasoning {
  signal: string;
  details: string;
}

interface FundamentalAnalysis {
  signal: string;
  confidence: number;
  reasoning: {
    profitability_signal: SignalReasoning;
    growth_signal: SignalReasoning;
    financial_health_signal: SignalReasoning;
    price_ratios_signal: SignalReasoning;
  };
}

const progress = {
  updateStatus: (agent: string, ticker: string, status: string) => {
    console.log(`${agent}: ${ticker} - ${status}`);
  }
};

export async function fundamentalsAgent(state: AgentState) {
  const { data } = state;
  const { end_date, tickers } = data;
  
  // Initialize fundamental analysis for each ticker
  const fundamentalAnalysis: { [key: string]: FundamentalAnalysis } = {};

  for (const ticker of tickers) {
    progress.updateStatus("fundamentals_agent", ticker, "Fetching financial metrics");

    // Get the financial metrics
    const financialMetrics = await getFinalancialMetrics({
      ticker,
      endDate: end_date,
      period: "ttm",
      limit: 10
    });

    const metrics = financialMetrics[0];
    const signals: string[] = [];
    const reasoning: { [key: string]: SignalReasoning } = {};

    // 1. Profitability Analysis
    progress.updateStatus("fundamentals_agent", ticker, "Analyzing profitability");
    const { return_on_equity, net_margin, operating_margin } = metrics;
    
    const profitabilityThresholds: [number | null, number][] = [
      [return_on_equity, 0.15],
      [net_margin, 0.20],
      [operating_margin, 0.15]
    ];

    const profitabilityScore = profitabilityThresholds.reduce((score, [metric, threshold]) => 
      score + (metric !== null && metric > threshold ? 1 : 0), 0);

    signals.push(profitabilityScore >= 2 ? "bullish" : profitabilityScore === 0 ? "bearish" : "neutral");
    reasoning.profitability_signal = {
      signal: signals[0],
      details: `ROE: ${return_on_equity?.toFixed(2)}%, Net Margin: ${net_margin?.toFixed(2)}%, Op Margin: ${operating_margin?.toFixed(2)}%`
    };

    // 2. Growth Analysis
    progress.updateStatus("fundamentals_agent", ticker, "Analyzing growth");
    const { revenue_growth, earnings_growth, book_value_growth } = metrics;
    
    const growthThresholds: [number | null, number][] = [
      [revenue_growth, 0.10],
      [earnings_growth, 0.10],
      [book_value_growth, 0.10]
    ];

    const growthScore = growthThresholds.reduce((score, [metric, threshold]) =>
      score + (metric !== null && metric > threshold ? 1 : 0), 0);

    signals.push(growthScore >= 2 ? "bullish" : growthScore === 0 ? "bearish" : "neutral");
    reasoning.growth_signal = {
      signal: signals[1],
      details: `Revenue Growth: ${revenue_growth?.toFixed(2)}%, Earnings Growth: ${earnings_growth?.toFixed(2)}%`
    };

    // 3. Financial Health
    progress.updateStatus("fundamentals_agent", ticker, "Analyzing financial health");
    const { current_ratio, debt_to_equity, free_cash_flow_per_share, earnings_per_share } = metrics;
    
    let healthScore = 0;
    if (current_ratio && current_ratio > 1.5) healthScore++;
    if (debt_to_equity && debt_to_equity < 0.5) healthScore++;
    if (free_cash_flow_per_share && earnings_per_share && 
        free_cash_flow_per_share > earnings_per_share * 0.8) healthScore++;

    signals.push(healthScore >= 2 ? "bullish" : healthScore === 0 ? "bearish" : "neutral");
    reasoning.financial_health_signal = {
      signal: signals[2],
      details: `Current Ratio: ${current_ratio?.toFixed(2)}, D/E: ${debt_to_equity?.toFixed(2)}`
    };

    // 4. Price Ratios
    progress.updateStatus("fundamentals_agent", ticker, "Analyzing valuation ratios");
    const { price_to_earnings_ratio, price_to_book_ratio, price_to_sales_ratio } = metrics;
    
    const priceRatioThresholds: [number | null, number][] = [
      [price_to_earnings_ratio, 25],
      [price_to_book_ratio, 3],
      [price_to_sales_ratio, 5]
    ];

    const priceRatioScore = priceRatioThresholds.reduce((score, [metric, threshold]) =>
      score + (metric !== null && metric > threshold ? 1 : 0), 0);

    signals.push(priceRatioScore >= 2 ? "bullish" : priceRatioScore === 0 ? "bearish" : "neutral");
    reasoning.price_ratios_signal = {
      signal: signals[3],
      details: `P/E: ${price_to_earnings_ratio?.toFixed(2)}, P/B: ${price_to_book_ratio?.toFixed(2)}, P/S: ${price_to_sales_ratio?.toFixed(2)}`
    };

    // Calculate final signal and confidence
    progress.updateStatus("fundamentals_agent", ticker, "Calculating final signal");
    const bullishSignals = signals.filter(s => s === "bullish").length;
    const bearishSignals = signals.filter(s => s === "bearish").length;

    const overallSignal = bullishSignals > bearishSignals ? "bullish" :
                         bearishSignals > bullishSignals ? "bearish" : "neutral";
    
    const confidence = Math.round((Math.max(bullishSignals, bearishSignals) / signals.length) * 100);

    fundamentalAnalysis[ticker] = {
      signal: overallSignal,
      confidence,
      reasoning
    };

    progress.updateStatus("fundamentals_agent", ticker, "Done");
  }

  // Create the fundamental analysis message
  const message = new HumanMessage({
    content: JSON.stringify(fundamentalAnalysis),
    name: "fundamentals_agent"
  });

  // Show reasoning if enabled
  if (state.metadata.show_reasoning) {
    showAgentReasoning(fundamentalAnalysis, "Fundamental Analysis Agent");
  }

  // Update state with signals
  state.data.analyst_signals.fundamentals_agent = fundamentalAnalysis;

  return {
    messages: [message],
    data: state.data
  };
}

function showAgentReasoning(analysis: any, agentName: string): void {
  console.log(`\n${agentName} Reasoning:`);
  console.log(JSON.stringify(analysis, null, 2));
}