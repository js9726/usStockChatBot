"use client";

import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';

interface Message {
  text: string;
  isUser: boolean;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      // Extract potential tickers from the message
      const tickerRegex = /\$([A-Za-z]+)/g;
      const tickers = Array.from(userMessage.matchAll(tickerRegex)).map(match => match[1]);
      
      if (tickers.length > 0) {
        console.log('Sending request with tickers:', tickers);
        const response = await fetch('/api/analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            tickers,
            end_date: new Date().toISOString().split('T')[0], // Current date
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.data?.analyst_signals?.fundamentals_agent) {
          throw new Error('Invalid response format from API');
        }

        // Format the analysis response
        const analysisResponse = Object.entries(data.data.analyst_signals.fundamentals_agent)
          .map(([ticker, analysis]: [string, any]) => {
            return `${ticker.toUpperCase()}: ${analysis.signal.toUpperCase()} (${analysis.confidence}% confidence)\n` +
                   `Reasoning:\n` +
                   `- Profitability: ${analysis.reasoning.profitability_signal.details}\n` +
                   `- Growth: ${analysis.reasoning.growth_signal.details}\n` +
                   `- Financial Health: ${analysis.reasoning.financial_health_signal.details}\n` +
                   `- Price Ratios: ${analysis.reasoning.price_ratios_signal.details}`;
          })
          .join('\n\n');

        setMessages(prev => [...prev, { text: analysisResponse, isUser: false }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "Please include stock tickers in your message using the $ symbol (e.g., $AAPL, $GOOGL)", 
          isUser: false 
        }]);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages(prev => [...prev, { 
        text: `Error: ${error instanceof Error ? error.message : 'Failed to analyze stocks'}`, 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} message={msg.text} isUser={msg.isUser} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about stocks using $ symbol (e.g., How is $AAPL performing?)"
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded-lg ${
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Analyzing...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
