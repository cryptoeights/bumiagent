'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { formatCUSD } from '@/lib/constants';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AgentInfo {
  agentId: number;
  name: string;
  templateId: number;
  pricePerCall: string;
  ownerAddress: string;
  agentWallet: string;
}

export default function ChatPage() {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { address } = useAccount();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ agent: AgentInfo }>(`/agents/${agentId}`)
      .then(d => setAgent(d.agent))
      .catch(() => setError('Agent not found'));
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();

  async function sendMessage(e: React.FormEvent, withPayment = false) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setPaymentRequired(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError('');

    try {
      const headers: Record<string, string> = {};
      if (withPayment) {
        // MVP: send payment header to bypass x402
        // In production: this would be a real on-chain TX hash
        headers['x-payment'] = `celo:cUSD:${agent?.pricePerCall}:demo`;
      }

      const result = await apiFetch<{ response: string; model: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          callerAddress: address || undefined,
        }),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err: any) {
      if (err.status === 402) {
        const price = formatCUSD(err.data.accepts[0]?.maxAmountRequired || '0');
        const payTo = err.data.accepts[0]?.payTo;
        setPaymentRequired({ price, payTo, message: userMessage });
        // Remove the user message since we didn't get a response
        setMessages(prev => prev.slice(0, -1));
        setInput(userMessage); // Put message back in input
      } else {
        setError(err.error || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  }

  async function payAndChat() {
    if (!paymentRequired) return;
    setPaymentRequired(null);
    // Re-send with payment header
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await sendMessage(fakeEvent, true);
  }

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full">
        {/* Agent header */}
        <div className="px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h1 className="font-bold text-sm">{agent?.name || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Agent #{agentId}</span>
                {isOwner && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--celo-green)]/10 text-[var(--celo-green)] text-[10px]">
                    Owner (Free)
                  </span>
                )}
                {!isOwner && agent && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--celo-gold)]/10 text-[var(--celo-gold)] text-[10px]">
                    {formatCUSD(agent.pricePerCall)} cUSD/msg
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && !paymentRequired && (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-zinc-500 text-sm">Start a conversation with {agent?.name || 'the agent'}</p>
              {!isOwner && agent && (
                <p className="text-zinc-600 text-xs mt-2">
                  Price: {formatCUSD(agent.pricePerCall)} cUSD per message
                </p>
              )}
              {isOwner && (
                <p className="text-zinc-600 text-xs mt-2">
                  You own this agent — chat for free ✨
                </p>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--celo-green)]/10 text-zinc-200 rounded-br-md'
                    : 'bg-zinc-800/50 text-zinc-300 rounded-bl-md border border-zinc-800/50'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800/50 px-4 py-3 rounded-2xl rounded-bl-md border border-zinc-800/50">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Payment Required Card */}
          {paymentRequired && (
            <div className="p-4 rounded-xl bg-[var(--celo-gold)]/5 border border-[var(--celo-gold)]/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💳</span>
                <span className="font-semibold text-sm text-[var(--celo-gold)]">Payment Required (x402)</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                This agent charges <span className="text-zinc-200 font-mono">{paymentRequired.price} cUSD</span> per message.
              </p>
              <div className="text-[10px] text-zinc-600 font-mono mb-3 break-all">
                Pay to: {paymentRequired.payTo}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={payAndChat}
                  className="px-4 py-2 rounded-lg bg-[var(--celo-gold)] text-zinc-950 font-semibold text-xs hover:brightness-110 transition-all active:scale-95"
                >
                  Pay {paymentRequired.price} cUSD & Send
                </button>
                <button
                  onClick={() => setPaymentRequired(null)}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs hover:bg-zinc-800/50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-zinc-800/50">
          <form onSubmit={(e) => sendMessage(e, false)} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isOwner ? "Type your message (free for owner)..." : "Type your message..."}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
