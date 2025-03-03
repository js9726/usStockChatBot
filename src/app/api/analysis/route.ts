import { NextResponse } from 'next/server';
import { fundamentalsAgent } from '../../../../agents/fundamental/capability';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { tickers, end_date } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid tickers provided' },
        { status: 400 }
      );
    }

    if (!end_date) {
      return NextResponse.json(
        { error: 'End date is required' },
        { status: 400 }
      );
    }

    const state = {
      data: {
        tickers,
        end_date,
        analyst_signals: {}
      },
      metadata: {
        show_reasoning: true
      }
    };

    console.log('Calling fundamentals agent with state:', state);
    const result = await fundamentalsAgent(state);
    console.log('Received result from fundamentals agent:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform analysis' },
      { status: 500 }
    );
  }
} 