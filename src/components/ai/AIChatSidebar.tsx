import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, FileSearch, MessageSquare, Loader2, Send, Search, ChevronRight, RotateCcw, TrendingUp, Tag, Users, Smile, ListTodo, Globe, FileType, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { list, post } from '@/lib/api/crud';
import { sendChatMessage } from '@/lib/api/ai';
import { AddToCalendarButton } from '@/components/AddToCalendarButton';
import type { Document, AISummary, AIAnalysis } from '@/types/dms';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingDoc?: Document | null;
  onDocConsumed?: () => void;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your AI document assistant. I can help you summarize documents, extract key insights, and answer questions about your data. How can I help you today?",
  timestamp: new Date(),
};

type AnalysisMode = 'summarize' | 'analyze';

export function AIChatSidebar({ isOpen, onClose, pendingDoc, onDocConsumed }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analyze'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoRunRef = useRef(false);

  // Chat tab state - document selection
  const [chatDocuments, setChatDocuments] = useState<Document[]>([]);
  const [chatDocsLoading, setChatDocsLoading] = useState(false);
  const [chatDocSearch, setChatDocSearch] = useState('');
  const [selectedChatDoc, setSelectedChatDoc] = useState<Document | null>(null);
  const [showChatDocPicker, setShowChatDocPicker] = useState(false);

  // Doc Analysis tab state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('summarize');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch documents for both chat and analyze tabs
  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch for analyze tab if not already loaded
    if (activeTab === 'analyze' && documents.length === 0) {
      setDocsLoading(true);
      list('DOCUMENTS')
        .then((data: any) => setDocuments(Array.isArray(data) ? data : []))
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false));
    }
    
    // Fetch for chat tab if not already loaded
    if (activeTab === 'chat' && chatDocuments.length === 0 && showChatDocPicker) {
      setChatDocsLoading(true);
      list('DOCUMENTS')
        .then((data: any) => setChatDocuments(Array.isArray(data) ? data : []))
        .catch(() => setChatDocuments([]))
        .finally(() => setChatDocsLoading(false));
    }
  }, [activeTab, showChatDocPicker, isOpen]);

  // Pre-select a document and auto-run analysis when pendingDoc is provided
  useEffect(() => {
    if (!isOpen || !pendingDoc) return;
    setActiveTab('analyze');
    setSummary(null);
    setAnalysis(null);
    setAnalysisError(null);
    setAnalysisMode('summarize');
    setSelectedDoc(pendingDoc);
    shouldAutoRunRef.current = true;
    onDocConsumed?.();
    // Ensure the document appears in the list
    setDocuments((prev) =>
      prev.some((d) => d.id === pendingDoc.id) ? prev : [pendingDoc, ...prev]
    );
  }, [pendingDoc, isOpen]);

  // Auto-run analysis after selectedDoc is committed to state
  useEffect(() => {
    if (!shouldAutoRunRef.current || !selectedDoc) return;
    shouldAutoRunRef.current = false;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setSummary(null);
    setAnalysis(null);
    post('DOCUMENT_SUMMARIZE', {}, { id: selectedDoc.id })
      .then((result) => setSummary(result as AISummary))
      .catch((err: any) => setAnalysisError(err?.message || 'AI analysis failed. Please try again.'))
      .finally(() => setAnalysisLoading(false));
  }, [selectedDoc]);

  const handleDocSelect = (doc: Document) => {
    setSelectedDoc(doc);
    setSummary(null);
    setAnalysis(null);
    setAnalysisError(null);
  };

  const handleRunAnalysis = async () => {
    if (!selectedDoc) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setSummary(null);
    setAnalysis(null);
    try {
      const endpoint = analysisMode === 'summarize' ? 'DOCUMENT_SUMMARIZE' : 'DOCUMENT_ANALYZE';
      const result = await post(endpoint, {}, { id: selectedDoc.id });
      if (analysisMode === 'summarize') setSummary(result as AISummary);
      else setAnalysis(result as AIAnalysis);
    } catch (err: any) {
      setAnalysisError(err?.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const sentimentColor = (s: string) =>
    s === 'positive' ? 'text-emerald-600 bg-emerald-50' :
    s === 'negative' ? 'text-red-600 bg-red-50' :
    'text-gray-600 bg-gray-100';

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.document_type?.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Auto-resize textarea (used by chat tab)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      // Convert message history to format expected by API
      const history = messages
        .filter(m => m.id !== 'welcome') // Skip welcome message
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage(userMsg.content, history, selectedChatDoc?.id);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className={cn(
        'fixed top-0 right-0 h-screen w-[380px] z-50',
        'flex flex-col bg-white',
        'shadow-[-12px_0_40px_rgba(0,0,0,0.12)]',
        'transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1e3c21] to-[#2a5230] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">AI Assistant</p>
            <p className="text-white/55 text-xs mt-0.5">Document Intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
          aria-label="Close AI Assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            activeTab === 'chat'
              ? 'text-[#1e3c21] border-b-2 border-[#1e3c21] bg-[#1e3c21]/5'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            activeTab === 'analyze'
              ? 'text-[#1e3c21] border-b-2 border-[#1e3c21] bg-[#1e3c21]/5'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          )}
        >
          <FileSearch className="h-3.5 w-3.5" />
          Doc Analysis
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <>
          {/* Document Context Bar */}
          {selectedChatDoc && (
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
              <FileSearch className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-900 truncate">Analyzing: {selectedChatDoc.title}</p>
              </div>
              <button
                onClick={() => setSelectedChatDoc(null)}
                className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                aria-label="Remove document context"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Quick Document Picker Button (when no doc selected) */}
          {!selectedChatDoc && !showChatDocPicker && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowChatDocPicker(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white hover:border-gray-300 transition-all"
              >
                <FileSearch className="h-3 w-3" />
                Add Document Context
              </button>
            </div>
          )}

          {/* Document Picker */}
          {showChatDocPicker && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex-shrink-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pick a document</p>
                <button
                  onClick={() => setShowChatDocPicker(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Close document picker"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search documents…"
                  value={chatDocSearch}
                  onChange={(e) => setChatDocSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3c21]/25 focus:border-[#1e3c21] transition-all"
                />
              </div>

              {/* Document List */}
              <div className="max-h-48 overflow-y-auto space-y-1">
                {chatDocsLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1e3c21]" />
                  </div>
                )}
                {!chatDocsLoading && chatDocuments.length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">No documents found.</div>
                )}
                {!chatDocsLoading && chatDocuments
                  .filter((d) =>
                    d.title.toLowerCase().includes(chatDocSearch.toLowerCase()) ||
                    d.document_type?.toLowerCase().includes(chatDocSearch.toLowerCase())
                  )
                  .map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedChatDoc(doc);
                        setShowChatDocPicker(false);
                      }}
                      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-100 hover:border-[#1e3c21]/30 hover:bg-[#1e3c21]/5 transition-all group text-xs"
                    >
                      <FileSearch className="h-3 w-3 text-gray-400 group-hover:text-[#1e3c21] flex-shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{doc.document_type || doc.file_type}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3c21] to-[#2a5230] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[82%]">
                  <div
                    className={cn(
                      'rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#D70F0E] to-[#E5600B] text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p
                    className={cn(
                      'text-[10px] text-gray-400',
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    )}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e3c21] to-[#2a5230] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/60 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={selectedChatDoc ? `Ask about ${selectedChatDoc.title}…` : "Ask anything about your documents…"}
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3c21]/25 focus:border-[#1e3c21] transition-all min-h-[38px] max-h-[120px] overflow-y-auto leading-relaxed disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-[#1e3c21] to-[#2a5230] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all shadow-sm"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}

      {/* Doc Analysis Tab */}
      {activeTab === 'analyze' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedDoc ? (
            /* ── Document Picker ── */
            <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select a document</p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search documents…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3c21]/25 focus:border-[#1e3c21] transition-all"
                />
              </div>

              {/* Document List */}
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {docsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-[#1e3c21]" />
                  </div>
                )}
                {!docsLoading && filteredDocs.length === 0 && (
                  <div className="text-center py-10 text-sm text-gray-400">
                    {documents.length === 0 ? 'No documents found.' : 'No results match your search.'}
                  </div>
                )}
                {!docsLoading && filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSelect(doc)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-[#1e3c21]/30 hover:bg-[#1e3c21]/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#1e3c21]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                      <FileSearch className="h-4 w-4 text-gray-500 group-hover:text-[#1e3c21] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.document_type || doc.file_type}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#1e3c21] flex-shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Analysis View ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Selected doc header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex-shrink-0">
                <button
                  onClick={() => { setSelectedDoc(null); setSummary(null); setAnalysis(null); setAnalysisError(null); }}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Back to document list"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{selectedDoc.title}</p>
                  <p className="text-[10px] text-gray-400">{selectedDoc.document_type || selectedDoc.file_type}</p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 px-4 pt-3 pb-2 flex-shrink-0">
                {(['summarize', 'analyze'] as AnalysisMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setAnalysisMode(mode); setSummary(null); setAnalysis(null); setAnalysisError(null); }}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-xs font-medium transition-all',
                      analysisMode === mode
                        ? 'bg-[#1e3c21] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {mode === 'summarize' ? 'Summarize' : 'Deep Analysis'}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-3 flex-shrink-0 space-y-2">
                {!summary && !analysis && !analysisLoading && (
                  <>
                    <button
                      onClick={handleRunAnalysis}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#1e3c21] to-[#2a5230] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {analysisMode === 'summarize' ? 'Generate Summary' : 'Run Deep Analysis'}
                    </button>
                    {analysisError && (
                      <p className="text-xs text-red-500 text-center">{analysisError}</p>
                    )}
                  </>
                )}
                {(summary || analysis) && (
                  <AddToCalendarButton document={selectedDoc} />
                )}
              </div>

              {/* Loading */}
              {analysisLoading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1e3c21]" />
                  <p className="text-xs text-gray-500">
                    {analysisMode === 'summarize' ? 'Generating summary…' : 'Analysing document…'}
                  </p>
                </div>
              )}

              {/* Summary Results */}
              {summary && !analysisLoading && (
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                  {/* Summary */}
                  <div className="bg-[#1e3c21]/5 rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#1e3c21] mb-1.5">Summary</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{summary.summary}</p>
                  </div>

                  {/* Key Points */}
                  {summary.key_points?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                        <ListTodo className="h-3 w-3" /> Key Points
                      </p>
                      <ul className="space-y-1">
                        {summary.key_points.map((pt, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1e3c21]/50 flex-shrink-0 mt-1.5" />
                            {pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Meta chips */}
                  <div className="flex gap-2 flex-wrap">
                    {summary.doc_type && (
                      <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <FileType className="h-3 w-3" />{summary.doc_type}
                      </span>
                    )}
                    {summary.language && (
                      <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <Globe className="h-3 w-3" />{summary.language}
                      </span>
                    )}
                  </div>

                  {/* Re-run */}
                  <button
                    onClick={() => { setSummary(null); setAnalysisError(null); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Re-run
                  </button>
                </div>
              )}

              {/* Deep Analysis Results */}
              {analysis && !analysisLoading && (
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                  {/* Sentiment */}
                  <div className="flex items-center gap-2">
                    <span className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full capitalize', sentimentColor(analysis.sentiment))}>
                      <Smile className="h-3 w-3" /> {analysis.sentiment}
                    </span>
                  </div>

                  {/* Insights */}
                  <div className="bg-[#1e3c21]/5 rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#1e3c21] mb-1.5">Insights</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{analysis.insights}</p>
                  </div>

                  {/* Themes */}
                  {analysis.themes?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Themes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.themes.map((t, i) => (
                          <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {analysis.entities?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Entities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.entities.map((e, i) => (
                          <span key={i} className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {analysis.action_items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Action Items
                      </p>
                      <ul className="space-y-1">
                        {analysis.action_items.map((a, i) => (
                          <li key={i} className="flex gap-2 text-xs text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Re-run */}
                  <button
                    onClick={() => { setAnalysis(null); setAnalysisError(null); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" /> Re-run
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
