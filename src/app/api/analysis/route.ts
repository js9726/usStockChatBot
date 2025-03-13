import { NextResponse } from 'next/server';
import { fundamentalsAgent } from '../../../../agents/fundamental/capability';
import { formatTickers } from '@/utils/format';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    if (!body.tickers || !Array.isArray(body.tickers)) {
      console.error('Invalid request: tickers array is missing or invalid');
      return NextResponse.json(
        { error: 'Invalid request: tickers array is required' },
        { status: 400 }
      );
    }

    // Format tickers (remove $ symbol and trim)
    const formattedTickers = formatTickers(body.tickers);
    console.log('Formatted tickers:', formattedTickers);

    const state = {
      data: {
        tickers: formattedTickers,
        end_date: body.endDate || new Date().toISOString(),
        analyst_signals: {}
      },
      metadata: {
        show_reasoning: true
      }
    };

    console.log('Calling fundamentals agent with state:', state);

    try {
      const result = await fundamentalsAgent(state);
      console.log('Fundamentals agent result:', result);
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error in fundamentals agent:', error);
      if (error instanceof Error) {
        // Check for specific error types
        if (error.message.includes('404') || error.message.includes('not found')) {
          return NextResponse.json(
            { error: `Stock symbol not found. Please check the symbol and try again.` },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { error: `Analysis failed: ${error.message}` },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'An unexpected error occurred during analysis' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 