'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { useParams } from 'next/navigation';
import { celo } from 'wagmi/chains';
import { Navbar } from '@/components/Navbar';
import { apiFetch } from '@/lib/api';
import { Markdown } from '@/components/Markdown';
import { formatCUSD } from '@/lib/constants';
import { CUSD_ADDRESS, ERC20_ABI } from '@/lib/contracts';

interface Message {
  role: 'user' | 'assistant';
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
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState<{ price: string; payTo: string; amount: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'confirming' | 'chatting'>('idle');
  const pendingMessageRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // wagmi write contract hook
  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isSuccess: txConfirmed, isLoading: txConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    apiFetch<{ agent: AgentInfo }>(`/agents/${agentId}`)
      .then(d => setAgent(d.agent))
      .catch(() => setError('Agent not found'));
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();

  // When TX is confirmed, send the chat with the TX hash
  const sendWithPayment = useCallback(async (hash: string) => {
    if (!pendingMessageRef.current) return;

    setPaymentStatus('chatting');
    setLoading(true);

    try {
      const result = await apiFetch<{ response: string; model: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'x-payment-txhash': hash },
        body: JSON.stringify({
          message: pendingMessageRef.current,
          callerAddress: address,
        }),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      setPaymentRequired(null);
    } catch (err: any) {
      setError(err.error || err.detail || 'Payment verified but chat failed. Try again.');
    } finally {
      setLoading(false);
      setPaymentStatus('idle');
      pendingMessageRef.current = '';
      resetTx();
    }
  }, [agentId, address, resetTx]);

  useEffect(() => {
    if (txConfirmed && txHash) {
      sendWithPayment(txHash);
    }
  }, [txConfirmed, txHash, sendWithPayment]);

  useEffect(() => {
    if (txError) {
      setError(txError.message.includes('User rejected') ? 'Transaction cancelled' : `TX failed: ${txError.message.slice(0, 100)}`);
      setPaymentStatus('idle');
      setLoading(false);
      resetTx();
    }
  }, [txError, resetTx]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setPaymentRequired(null);
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const result = await apiFetch<{ response: string; model: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          callerAddress: address || undefined,
        }),
      });

      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (err: any) {
      if (err.status === 402) {
        const accept = err.data.accepts[0];
        setPaymentRequired({
          price: formatCUSD(accept?.maxAmountRequired || '0'),
          payTo: accept?.payTo,
          amount: accept?.maxAmountRequired,
        });
        // Keep the user message visible, store it for after payment
        pendingMessageRef.current = userMessage;
      } else {
        setError(err.error || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePay() {
    if (!paymentRequired || !address || !agent) return;

    // Ensure we're on Celo mainnet
    if (chainId !== celo.id) {
      switchChain({ chainId: celo.id });
      return;
    }

    setPaymentStatus('sending');
    setLoading(true);
    setError('');

    writeContract({
      address: CUSD_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [agent.agentWallet as `0x${string}`, BigInt(paymentRequired.amount)],
      chain: celo,
    });
  }

  const statusText = paymentStatus === 'sending' ? 'Confirm in wallet...'
    : paymentStatus === 'confirming' || txConfirming ? 'Confirming on Celo...'
    : paymentStatus === 'chatting' ? 'Payment verified! Getting response...'
    : '';

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col pt-16 max-w-3xl mx-auto w-full">
        {/* Agent header */}
        <div className="px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">🤖</div>
            <div>
              <h1 className="font-bold text-sm">{agent?.name || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>Agent #{agentId}</span>
                {isOwner && (
                  <span className="px-1.5 py-0.5 rounded bg-[var(--celo-green)]/10 text-[var(--celo-green)] text-[10px]">Owner (Free)</span>
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
              {isOwner && <p className="text-zinc-600 text-xs mt-2">You own this agent — chat for free ✨</p>}
              {!isOwner && agent && (
                <p className="text-zinc-600 text-xs mt-2">
                  Price: {formatCUSD(agent.pricePerCall)} cUSD per message — paid in real cUSD on Celo
                </p>
              )}
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[var(--celo-green)]/10 text-zinc-200 rounded-br-md'
                  : 'bg-zinc-800/50 text-zinc-300 rounded-bl-md border border-zinc-800/50'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <Markdown content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {loading && !paymentRequired && (
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
            <div className="p-5 rounded-xl bg-[var(--celo-gold)]/5 border border-[var(--celo-gold)]/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💳</span>
                <span className="font-semibold text-sm text-[var(--celo-gold)]">Payment Required (x402)</span>
              </div>
              <p className="text-sm text-zinc-400 mb-2">
                This agent charges <span className="text-zinc-200 font-bold">{paymentRequired.price} cUSD</span> per message.
              </p>
              <p className="text-xs text-zinc-500 mb-3">
                Real cUSD will be transferred from your wallet to the agent&apos;s wallet on Celo mainnet.
              </p>
              <div className="text-[10px] text-zinc-600 font-mono mb-4 p-2 rounded bg-zinc-900/50 break-all">
                Pay to: {paymentRequired.payTo}
              </div>

              {statusText && (
                <div className="text-xs text-[var(--celo-gold)] mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />
                  {statusText}
                </div>
              )}

              {txHash && (
                <div className="text-[10px] text-zinc-600 mb-3">
                  TX: <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener" className="text-[var(--celo-green)] hover:underline">{txHash.slice(0, 14)}...{txHash.slice(-8)}</a>
                </div>
              )}

              <div className="flex gap-2">
                {!address ? (
                  <p className="text-xs text-red-400">Connect your wallet to pay</p>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={paymentStatus !== 'idle'}
                    className="px-5 py-2.5 rounded-lg bg-[var(--celo-gold)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {chainId !== celo.id ? 'Switch to Celo' : `Pay ${paymentRequired.price} cUSD & Send`}
                  </button>
                )}
                <button
                  onClick={() => { setPaymentRequired(null); pendingMessageRef.current = ''; resetTx(); }}
                  disabled={paymentStatus !== 'idle'}
                  className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all disabled:opacity-50"
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
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isOwner ? 'Type your message (free for owner)...' : 'Type your message...'}
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
