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
interface ModelInfo { id: string; name: string; tier: 'free' | 'premium'; costPerCall: string; description: string; webSearch: boolean; available: boolean; }

export default function ChatPage() {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [agentTier, setAgentTier] = useState<'free' | 'premium'>('free');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [convList, setConvList] = useState<ConvSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentRequired, setPaymentRequired] = useState<{ price: string; payTo: string; amount: string; modelName?: string } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'sending' | 'confirming' | 'chatting'>('idle');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs to avoid stale closures in callbacks
  const pendingMessageRef = useRef('');
  const messagesRef = useRef<Message[]>([]);
  const activeConvIdRef = useRef<number | null>(null);
  const selectedModelRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const txProcessedRef = useRef<string | null>(null); // Guard: prevent double-calling doChat

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { setMounted(true); }, []);

  const { writeContract, data: txHash, error: txError, reset: resetTx } = useWriteContract();
  const { isSuccess: txConfirmed, isLoading: txConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner = address?.toLowerCase() === agent?.ownerAddress?.toLowerCase();
  const currentModel = models.find(m => m.id === selectedModel);

  // Load agent + models
  useEffect(() => {
    apiFetch<{ agent: AgentInfo }>(`/agents/${agentId}`).then(d => setAgent(d.agent)).catch(() => {});
    apiFetch<{ models: ModelInfo[]; agentTier: 'free' | 'premium' }>(`/agents/${agentId}/models`).then(d => {
      setModels(d.models);
      setAgentTier(d.agentTier || 'free');
      // Default to first available model for the agent's tier
      const tier = d.agentTier || 'free';
      const defaultModel = d.models.find(m => m.tier === tier && m.available) || d.models.find(m => m.available);
      if (defaultModel) setSelectedModel(defaultModel.id);
    }).catch(() => {});
  }, [agentId]);

  // Load conversations
  const loadConvList = useCallback(async () => {
    if (!address) return;
    try {
      const data = await apiFetch<{ conversations: ConvSummary[] }>(`/conversations?userAddress=${address}&agentId=${agentId}`);
      setConvList(data.conversations);
    } catch {}
  }, [address, agentId]);

  useEffect(() => { loadConvList(); }, [loadConvList]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversation(convId: number) {
    try {
      const data = await apiFetch<{ conversation: { id: number; messages: Message[] } }>(`/conversations/${convId}`);
      setActiveConvId(convId);
      setMessages(Array.isArray(data.conversation.messages) ? data.conversation.messages : []);
      setError(''); setPaymentRequired(null);
    } catch { setError('Failed to load conversation'); }
  }

  function startNewChat() {
    setActiveConvId(null); setMessages([]); setError(''); setPaymentRequired(null); setInput('');
  }

  async function saveMessages(convId: number, newMsgs: Message[]) {
    try {
      await apiFetch(`/conversations/${convId}/messages`, { method: 'PATCH', body: JSON.stringify({ messages: newMsgs }) });
      loadConvList();
    } catch {}
  }

  async function getOrCreateConversation(): Promise<number> {
    if (activeConvIdRef.current) return activeConvIdRef.current;
    if (!address) throw new Error('Connect wallet first');
    const data = await apiFetch<{ conversation: { id: number } }>('/conversations', {
      method: 'POST', body: JSON.stringify({ agentId, userAddress: address, title: 'New Chat' }),
    });
    const newId = data.conversation.id;
    setActiveConvId(newId);
    activeConvIdRef.current = newId;
    return newId;
  }

  // Send chat request to backend
  async function doChat(userMessage: string, txHashStr?: string): Promise<void> {
    const convId = await getOrCreateConversation();
    const userMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true); setError('');

    try {
      const headers: Record<string, string> = {};
      if (txHashStr) headers['x-payment-txhash'] = txHashStr;

      const result = await apiFetch<{ response: string; model: string }>(`/agents/${agentId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          callerAddress: address || undefined,
          history: messagesRef.current,
          modelId: selectedModelRef.current || undefined,
        }),
      });

      const assistantMsg: Message = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessages(convId, [userMsg, assistantMsg]);
      setPaymentRequired(null);
    } catch (err: any) {
      if (err.status === 402) {
        const accept = err.data?.accepts?.[0];
        if (accept) {
          setPaymentRequired({
            price: formatCUSD(accept.maxAmountRequired || '0'),
            payTo: accept.payTo,
            amount: accept.maxAmountRequired,
            modelName: accept.modelId ? currentModel?.name : undefined,
          });
          pendingMessageRef.current = userMessage;
          setMessages(prev => prev.slice(0, -1)); // Remove user msg until paid
          setInput(userMessage);
        } else {
          setError('Payment required but no pricing info returned');
        }
      } else {
        setError(err.error || err.detail || 'Failed to send message');
      }
    } finally {
      setLoading(false);
    }
  }

  // When TX confirmed, retry chat with txHash — ONCE only
  useEffect(() => {
    if (txConfirmed && txHash && pendingMessageRef.current && txProcessedRef.current !== txHash) {
      txProcessedRef.current = txHash; // Mark as processed
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = '';
      setPaymentStatus('chatting');
      doChat(msg, txHash).finally(() => {
        setPaymentStatus('idle');
        resetTx();
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txConfirmed, txHash]);

  useEffect(() => {
    if (txError) {
      setError(txError.message.includes('User rejected') ? 'Transaction cancelled' : `TX error: ${txError.message.slice(0, 120)}`);
      setPaymentStatus('idle'); setLoading(false); resetTx();
    }
  }, [txError, resetTx]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    await doChat(msg);
  }

  function handlePay() {
    if (!paymentRequired || !address || !agent) return;
    if (chainId !== celo.id) { switchChain({ chainId: celo.id }); return; }
    setPaymentStatus('sending'); setLoading(true); setError('');
    txProcessedRef.current = null; // Reset guard for new TX
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
    : paymentStatus === 'chatting' ? 'Payment confirmed! Getting response...' : '';

  const costDisplay = currentModel?.tier === 'premium'
    ? agentTier === 'premium' ? 'Included' : `${formatCUSD(currentModel.costPerCall)} cUSD/msg`
    : isOwner ? 'Free' : agent ? `${formatCUSD(agent.pricePerCall)} cUSD/msg` : '...';

  if (!mounted) return null;

  return (
    <div className="noise-bg min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex pt-16">
        {/* Sidebar — overlay on mobile, push on desktop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'} fixed md:relative z-40 md:z-auto h-[calc(100vh-4rem)] md:h-auto shrink-0 border-r border-zinc-800/50 bg-zinc-950 md:bg-zinc-950/50 transition-all overflow-hidden flex flex-col`}>
          <div className="p-3 border-b border-zinc-800/50">
            <button onClick={startNewChat}
              className="w-full px-3 py-2 rounded-lg bg-[var(--celo-green)]/10 text-[var(--celo-green)] text-xs font-semibold hover:bg-[var(--celo-green)]/20 transition-all flex items-center gap-2">
              <span>+</span> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!address && <p className="text-xs text-zinc-600 p-2">Connect wallet to see history</p>}
            {convList.map(conv => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all group flex items-center justify-between ${
                  activeConvId === conv.id ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{conv.title}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{conv.messageCount} msgs</div>
                </div>
                <span onClick={(e) => deleteConv(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all ml-2 text-base leading-none">×</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col">
          {/* Header + Model selector */}
          <div className="px-3 sm:px-6 py-3 border-b border-zinc-800/50 flex items-center gap-2 sm:gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg">
              {sidebarOpen ? '◁' : '▷'}
            </button>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-base">🤖</div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sm">{agent?.name || 'Loading...'}</h1>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span>Agent #{agentId}</span>
                <span className={`px-1 py-0.5 rounded ${
                  currentModel?.tier === 'premium' ? 'bg-[var(--celo-gold)]/10 text-[var(--celo-gold)]'
                  : isOwner ? 'bg-[var(--celo-green)]/10 text-[var(--celo-green)]'
                  : 'bg-zinc-800 text-zinc-400'
                }`}>{costDisplay}</span>
              </div>
            </div>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-[var(--celo-green)]/50 cursor-pointer shrink-0 max-w-[140px] sm:max-w-none">
              <optgroup label="Free Models">
                {models.filter(m => m.tier === 'free').map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </optgroup>
              <optgroup label={agentTier === 'premium' ? 'Premium (included)' : 'Premium (pay per call)'}>
                {models.filter(m => m.tier === 'premium').map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{!m.available ? ' 🔒' : ''} — {agentTier === 'premium' ? 'included' : `${formatCUSD(m.costPerCall)} cUSD`}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Premium model info bar */}
          {currentModel?.tier === 'premium' && (
            <div className="px-3 sm:px-6 py-2 bg-[var(--celo-gold)]/5 border-b border-[var(--celo-gold)]/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[var(--celo-gold)]">⚡</span>
              <span className="text-zinc-400">{currentModel.name}</span>
              <span className="text-zinc-600">·</span>
              {agentTier === 'premium' ? (
                <span className="text-[var(--celo-green)] font-semibold">Included with Premium ✓</span>
              ) : (
                <span className="text-[var(--celo-gold)] font-mono">{formatCUSD(currentModel.costPerCall)} cUSD/msg</span>
              )}
              {currentModel.webSearch && <>
                <span className="text-zinc-600">·</span>
                <span className="text-[var(--celo-green)]">🌐 Web Search</span>
              </>}
              {agentTier !== 'premium' && <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">Everyone pays per call</span>
              </>}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4">
            {messages.length === 0 && !paymentRequired && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-zinc-500 text-sm">Start a conversation with {agent?.name || 'the agent'}</p>
                {currentModel?.tier === 'free' && isOwner && <p className="text-zinc-600 text-xs mt-1">Free model — chat for free ✨</p>}
                {currentModel?.tier === 'free' && !isOwner && agent && <p className="text-zinc-600 text-xs mt-1">Free model: {formatCUSD(agent.pricePerCall)} cUSD/msg</p>}
                {currentModel?.tier === 'premium' && agentTier === 'premium' && <p className="text-[var(--celo-green)] text-xs mt-1">Premium model — included with subscription ✓</p>}
                {currentModel?.tier === 'premium' && agentTier !== 'premium' && <p className="text-[var(--celo-gold)] text-xs mt-1">Premium: {formatCUSD(currentModel.costPerCall)} cUSD/msg for everyone</p>}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[var(--celo-green)]/10 text-zinc-200 rounded-br-md'
                    : 'bg-zinc-800/50 text-zinc-300 rounded-bl-md border border-zinc-800/50'
                }`}>
                  {msg.role === 'user' ? <div className="whitespace-pre-wrap">{msg.content}</div> : <Markdown content={msg.content} />}
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
                  <span className="font-semibold text-sm text-[var(--celo-gold)]">
                    Payment Required{paymentRequired.modelName ? ` — ${paymentRequired.modelName}` : ''}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-2">
                  Cost: <span className="text-zinc-200 font-bold">{paymentRequired.price} cUSD</span>
                  {currentModel?.tier === 'premium' && <span className="text-zinc-500"> (premium model)</span>}
                </p>
                <div className="text-[10px] text-zinc-600 font-mono mb-4 p-2 rounded bg-zinc-900/50 break-all">Pay to: {paymentRequired.payTo}</div>
                {statusText && (
                  <div className="text-xs text-[var(--celo-gold)] mb-3 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[var(--celo-gold)] border-t-transparent rounded-full animate-spin" />{statusText}
                  </div>
                )}
                {txHash && (
                  <div className="text-[10px] text-zinc-600 mb-3">
                    TX: <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noopener" className="text-[var(--celo-green)] hover:underline">
                      {(txHash as string).slice(0, 14)}...{(txHash as string).slice(-8)}
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  {!address ? <p className="text-xs text-red-400">Connect wallet to pay</p> : (
                    <button onClick={handlePay} disabled={paymentStatus !== 'idle'}
                      className="px-5 py-2.5 rounded-lg bg-[var(--celo-gold)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">
                      {chainId !== celo.id ? 'Switch to Celo' : `Pay ${paymentRequired.price} cUSD & Send`}
                    </button>
                  )}
                  <button onClick={() => { setPaymentRequired(null); pendingMessageRef.current = ''; resetTx(); setLoading(false); }}
                    disabled={paymentStatus !== 'idle'}
                    className="px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800/50 transition-all disabled:opacity-50">Cancel</button>
                </div>
              </div>
            )}

            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-zinc-800/50">
            <form onSubmit={sendMessage} className="flex gap-3">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                placeholder={currentModel?.tier === 'premium' ? `Message (${currentModel.name})...` : isOwner ? 'Type your message (free)...' : 'Type your message...'}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-[var(--celo-green)]/50 focus:ring-1 focus:ring-[var(--celo-green)]/20 transition-all text-sm disabled:opacity-50" />
              <button type="submit" disabled={loading || !input.trim()}
                className="px-5 py-3 rounded-xl bg-[var(--celo-green)] text-zinc-950 font-semibold text-sm hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">Send</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
