'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { useParams } from 'next/navigation';
import { celo } from 'wagmi/chains';
import { Navbar } from '@/components/Navbar';
import { Markdown } from '@/components/Markdown';
import { apiFetch } from '@/lib/api';
import { formatCUSD } from '@/lib/constants';
import { CUSD_ADDRESS, ERC20_ABI } from '@/lib/contracts';

interface Message { role: 'user' | 'assistant'; content: string; }
interface ConvSummary { id: number; title: string; messageCount: number; updatedAt: string; }
interface AgentInfo { agentId: number; name: string; templateId: number; pricePerCall: string; ownerAddress: string; agentWallet: string; }

export default function ChatPage() {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [convList, setConvList] = useState<ConvSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState<{ price: string; payTo: string; amount: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'confirming' | 'chatting'>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pendingMessageRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isSuccess: txConfirmed, isLoading: txConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();

  // Load agent info
  useEffect(() => {
    apiFetch<{ agent: AgentInfo }>(`/agents/${agentId}`).then(d => setAgent(d.agent)).catch(() => {});
  }, [agentId]);

  // Load conversation list
  const loadConvList = useCallback(async () => {
    if (!address) return;
    const data = await apiFetch<{ conversations: ConvSummary[] }>(`/conversations?userAddress=${address}&agentId=${agentId}`);
    setConvList(data.conversations);
  }, [address, agentId]);

  useEffect(() => { loadConvList(); }, [loadConvList]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load a conversation
  async function loadConversation(convId: number) {
    const data = await apiFetch<{ conversation: { id: number; messages: Message[] } }>(`/conversations/${convId}`);
    setActiveConvId(convId);
    setMessages(Array.isArray(data.conversation.messages) ? data.conversation.messages : []);
    setError('');
    setPaymentRequired(null);
  }

  // Start new chat
  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setError('');
    setPaymentRequired(null);
    setInput('');
  }

  // Save messages to conversation
  async function saveMessages(convId: number, newMsgs: Message[]) {
    await apiFetch(`/conversations/${convId}/messages`, {
      method: 'PATCH',
      body: JSON.stringify({ messages: newMsgs }),
    });
    loadConvList();
  }

  // Create conversation if needed, return id
  async function ensureConversation(): Promise<number> {
    if (activeConvId) return activeConvId;
    if (!address) throw new Error('Connect wallet');

    const data = await apiFetch<{ conversation: { id: number } }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ agentId, userAddress: address, title: 'New Chat' }),
    });
    setActiveConvId(data.conversation.id);
    return data.conversation.id;
  }

  // Send with payment (after TX confirmed)
  const sendWithPayment = useCallback(async (hash: string) => {
    if (!pendingMessageRef.current) return;
    setPaymentStatus('chatting');
    setLoading(true);
    try {
      const convId = await ensureConversation();
      const userMsg: Message = { role: 'user', content: pendingMessageRef.current };
      setMessages(prev => [...prev, userMsg]);

      const result = await apiFetch<{ response: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        headers: { 'x-payment-txhash': hash },
        body: JSON.stringify({ message: pendingMessageRef.current, callerAddress: address, history: messages }),
      });

      const assistantMsg: Message = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessages(convId, [userMsg, assistantMsg]);
      setPaymentRequired(null);
    } catch (err: any) {
      setError(err.error || 'Chat failed after payment');
    } finally {
      setLoading(false);
      setPaymentStatus('idle');
      pendingMessageRef.current = '';
      resetTx();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, address, messages]);

  useEffect(() => { if (txConfirmed && txHash) sendWithPayment(txHash); }, [txConfirmed, txHash, sendWithPayment]);
  useEffect(() => {
    if (txError) {
      setError(txError.message.includes('User rejected') ? 'Transaction cancelled' : `TX failed: ${txError.message.slice(0, 100)}`);
      setPaymentStatus('idle'); setLoading(false); resetTx();
    }
  }, [txError, resetTx]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');
    setPaymentRequired(null);
    setError('');

    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const convId = await ensureConversation();

      const result = await apiFetch<{ response: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: userMessage, callerAddress: address || undefined, history: messages }),
      });

      const assistantMsg: Message = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessages(convId, [userMsg, assistantMsg]);
    } catch (err: any) {
      if (err.status === 402) {
        const accept = err.data.accepts[0];
        setPaymentRequired({ price: formatCUSD(accept?.maxAmountRequired || '0'), payTo: accept?.payTo, amount: accept?.maxAmountRequired });
        pendingMessageRef.current = userMessage;
        setMessages(prev => prev.slice(0, -1)); // Remove user msg until paid
        setInput(userMessage);
      } else {
        setError(err.error || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePay() {
    if (!paymentRequired || !address || !agent) return;
    if (chainId !== celo.id) { switchChain({ chainId: celo.id }); return; }
    setPaymentStatus('sending'); setLoading(true); setError('');
    writeContract({
      address: CUSD_ADDRESS, abi: ERC20_ABI, functionName: 'transfer',
      args: [agent.agentWallet as `0x${string}`, BigInt(paymentRequired.amount)], chain: celo,
    });
  }

  async function deleteConv(convId: number, e: React.MouseEvent) {
    e.stopPropagation();
    await apiFetch(`/conversations/${convId}`, { method: 'DELETE' });
    if (activeConvId === convId) startNewChat();
    loadConvList();
  }

  const statusText = paymentStatus === 'sending' ? 'Confirm in wallet...'
    : paymentStatus === 'confirming' || txConfirming ? 'Confirming on Celo...'
    : paymentStatus === 'chatting' ? 'Payment verified! Getting response...' : '';

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex pt-16">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} shrink-0 border-r border-zinc-800/50 bg-zinc-950/50 transition-all overflow-hidden flex flex-col`}>
          <div className="p-3 border-b border-zinc-800/50">
            <button
              onClick={startNewChat}
              className="w-full px-3 py-2 rounded-lg bg-[var(--celo-green)]/10 text-[var(--celo-green)] text-xs font-semibold hover:bg-[var(--celo-green)]/20 transition-all flex items-center gap-2"
            >
              <span>+</span> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!address && <p className="text-xs text-zinc-600 p-2">Connect wallet to see history</p>}
            {convList.map(conv => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all group flex items-center justify-between ${
                  activeConvId === conv.id
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate">{conv.title}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{conv.messageCount} msgs</div>
                </div>
                <span
                  onClick={(e) => deleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-2 text-base leading-none"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
          {/* Agent header */}
          <div className="px-6 py-3 border-b border-zinc-800/50 flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg">
              {sidebarOpen ? '◁' : '▷'}
            </button>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-base">🤖</div>
            <div>
              <h1 className="font-bold text-sm">{agent?.name || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>Agent #{agentId}</span>
                {isOwner && <span className="px-1 py-0.5 rounded bg-[var(--celo-green)]/10 text-[var(--celo-green)]">Owner (Free)</span>}
                {!isOwner && agent && <span className="px-1 py-0.5 rounded bg-[var(--celo-gold)]/10 text-[var(--celo-gold)]">{formatCUSD(agent.pricePerCall)} cUSD/msg</span>}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && !paymentRequired && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-zinc-500 text-sm">Start a conversation with {agent?.name || 'the agent'}</p>
                {isOwner && <p className="text-zinc-600 text-xs mt-1">You own this agent — chat for free ✨</p>}
                {!isOwner && agent && <p className="text-zinc-600 text-xs mt-1">Price: {formatCUSD(agent.pricePerCall)} cUSD/msg — real cUSD on Celo</p>}
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

            {paymentRequired && (
              <div className="p-5 rounded-xl bg-[var(--celo-gold)]/5 border border-[var(--celo-gold)]/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">💳</span>
                  <span className="font-semibold text-sm text-[var(--celo-gold)]">Payment Required (x402)</span>
                </div>
                <p className="text-sm text-zinc-400 mb-2">
                  This agent charges <span className="text-zinc-200 font-bold">{paymentRequired.price} cUSD</span> per message.
                </p>
                <div className="text-[10px] text-zinc-600 font-mono mb-3 p-2 rounded bg-zinc-900/50 break-all">Pay to: {paymentRequired.payTo}</div>
                {statusText && (
                  <div className="text-xs text-[var(--celo-gold)] mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />
                    {statusText}
                  </div>
                )}
                {txHash && (
                  <div className="text-[10px] text-zinc-600 mb-3">
                    TX: <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener" className="text-[var(--celo-green)] hover:underline">{(txHash as string).slice(0, 14)}...{(txHash as string).slice(-8)}</a>
                  </div>
                )}
                <div className="flex gap-2">
                  {!address ? <p className="text-xs text-red-400">Connect wallet to pay</p> : (
                    <button onClick={handlePay} disabled={paymentStatus !== 'idle'}
                      className="px-5 py-2.5 rounded-lg bg-[var(--celo-gold)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">
                      {chainId !== celo.id ? 'Switch to Celo' : `Pay ${paymentRequired.price} cUSD & Send`}
                    </button>
                  )}
                  <button onClick={() => { setPaymentRequired(null); pendingMessageRef.current = ''; resetTx(); }}
                    disabled={paymentStatus !== 'idle'}
                    className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-zinc-800/50">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={isOwner ? 'Type your message (free for owner)...' : 'Type your message...'}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm disabled:opacity-50" />
              <button type="submit" disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
