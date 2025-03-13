import { HumanMessage, SystemMessage } from 'langchain/schema';
import OpenAI from 'openai';
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

// Initialize DeepSeek client
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
});

const systemPrompt = `You are a professional stock market analyst specializing in fundamental analysis.
Your task is to analyze financial metrics and provide detailed reasoning for your analysis.
Focus on four key areas:
1. Profitability (ROE, margins)
2. Growth (revenue, earnings, book value)
3. Financial Health (liquidity, leverage)
4. Price Ratios (P/E, P/B, P/S)

Provide your analysis in a structured format with clear reasoning for each aspect.`;

export async function fundamentalsAgent(state: AgentState) {
  const { data } = state;
  const { end_date, tickers } = data;
  
  const fundamentalAnalysis: { [key: string]: FundamentalAnalysis } = {};

  for (const ticker of tickers) {
    progress.updateStatus("fundamentals_agent", ticker, "Fetching financial metrics");

    const financialMetrics = await getFinalancialMetrics({
      ticker,
      endDate: end_date,
      period: "ttm",
      limit: 10
    });

    const metrics = financialMetrics[0];
    const metricsPrompt = `
    Analyze the following financial metrics for ${ticker}:
    
    Profitability Metrics:
    - Return on Equity: ${metrics.return_on_equity}%
    - Net Margin: ${metrics.net_margin}%
    - Operating Margin: ${metrics.operating_margin}%
    
    Growth Metrics:
    - Revenue Growth: ${metrics.revenue_growth}%
    - Earnings Growth: ${metrics.earnings_growth}%
    - Book Value Growth: ${metrics.book_value_growth}%
    
    Financial Health:
    - Current Ratio: ${metrics.current_ratio}
    - Debt to Equity: ${metrics.debt_to_equity}
    - Free Cash Flow per Share: ${metrics.free_cash_flow_per_share}
    - Earnings per Share: ${metrics.earnings_per_share}
    
    Price Ratios:
    - P/E Ratio: ${metrics.price_to_earnings_ratio}
    - P/B Ratio: ${metrics.price_to_book_ratio}
    - P/S Ratio: ${metrics.price_to_sales_ratio}
    
    Please provide a detailed analysis with signals (bullish/bearish/neutral) and confidence levels for each aspect.`;

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: metricsPrompt }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 1000
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      fundamentalAnalysis[ticker] = {
        signal: analysis.overall_signal,
        confidence: analysis.confidence,
        reasoning: {
          profitability_signal: analysis.profitability,
          growth_signal: analysis.growth,
          financial_health_signal: analysis.financial_health,
          price_ratios_signal: analysis.price_ratios
        }
      };

      progress.updateStatus("fundamentals_agent", ticker, "Analysis complete");
    } catch (error) {
      console.error(`Error analyzing ${ticker}:`, error);
      fundamentalAnalysis[ticker] = {
        signal: "neutral",
        confidence: 50,
        reasoning: {
          profitability_signal: { signal: "neutral", details: "AI analysis unavailable" },
          growth_signal: { signal: "neutral", details: "AI analysis unavailable" },
          financial_health_signal: { signal: "neutral", details: "AI analysis unavailable" },
          price_ratios_signal: { signal: "neutral", details: "AI analysis unavailable" }
        }
      };
    }
  }

  const message = new HumanMessage({
    content: JSON.stringify(fundamentalAnalysis),
    name: "fundamentals_agent"
  });

  if (state.metadata.show_reasoning) {
    showAgentReasoning(fundamentalAnalysis, "Fundamental Analysis Agent");
  }

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