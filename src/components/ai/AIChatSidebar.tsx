import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles, FileSearch, MessageSquare, Loader2, Send, Search, ChevronRight, ChevronLeft, RotateCcw, TrendingUp, Tag, Users, ListTodo, Globe, FileType } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Tone } from '@/lib/status';
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

export interface AIChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingDoc?: Document | null;
  onDocConsumed?: () => void;
  pendingChatMessage?: string | null;
  onChatMessageConsumed?: () => void;
  // New: which tab to open when triggered from a document card
  initialTab?: 'chat' | 'analyze';
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Ask about your documents. 360IQ can summarise one, pull out key points or answer a question about your data.',
  timestamp: new Date(),
};

type AnalysisMode = 'summarize' | 'analyze';

const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-[.04em] text-text-muted';
const PICKER_ROW = 'flex w-full items-center gap-3 rounded-md border border-line px-3 py-2 text-left transition-colors hover:bg-surface-2';
const AI_PANEL = 'rounded-lg bg-signal-tint iq-grad-border [--surface-1:var(--signal-tint)] p-4';
const AI_PANEL_LABEL = 'mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.04em] text-signal-text';

export function AIChatSidebar({
  isOpen,
  onClose,
  pendingDoc,
  onDocConsumed,
  pendingChatMessage,
  onChatMessageConsumed,
  initialTab,
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analyze'>(initialTab ?? 'chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoRunRef = useRef(false);

  // Chat tab state
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

  // Switch to the correct tab when initialTab changes
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'analyze' && documents.length === 0) {
      setDocsLoading(true);
      list('DOCUMENTS')
        .then((data: any) => setDocuments(Array.isArray(data) ? data : []))
        .catch(() => setDocuments([]))
        .finally(() => setDocsLoading(false));
    }
    if (activeTab === 'chat' && chatDocuments.length === 0 && showChatDocPicker) {
      setChatDocsLoading(true);
      list('DOCUMENTS')
        .then((data: any) => setChatDocuments(Array.isArray(data) ? data : []))
        .catch(() => setChatDocuments([]))
        .finally(() => setChatDocsLoading(false));
    }
  }, [activeTab, showChatDocPicker, isOpen]);

  // Pre-select document and auto-run when pendingDoc is provided
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
    setDocuments(prev =>
      prev.some(d => d.id === pendingDoc.id) ? prev : [pendingDoc, ...prev]
    );
  }, [pendingDoc, isOpen]);

  // Pre-fill chat input from dashboard AI insights
  useEffect(() => {
    if (!isOpen || !pendingChatMessage) return;
    setActiveTab('chat');
    setInput(pendingChatMessage);
    onChatMessageConsumed?.();
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [pendingChatMessage, isOpen]);

  // Auto-run analysis after selectedDoc is committed to state
  useEffect(() => {
    if (!shouldAutoRunRef.current || !selectedDoc) return;
    shouldAutoRunRef.current = false;
    setAnalysisLoading(true);
    setAnalysisError(null);
    setSummary(null);
    setAnalysis(null);
    post('DOCUMENT_SUMMARIZE', {}, { id: selectedDoc.id })
      .then(result => setSummary(result as AISummary))
      .catch((err: any) => setAnalysisError(err?.message || "Couldn't analyse this document. Try again."))
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
      setAnalysisError(err?.message || "Couldn't analyse this document. Try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const sentimentTone = (s: string): Tone =>
    s === 'positive' ? 'positive' : s === 'negative' ? 'risk' : 'neutral';

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
    d.document_type?.toLowerCase().includes(docSearch.toLowerCase())
  );

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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);
    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(userMsg.content, history, selectedChatDoc?.id);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Couldn't get an answer. Send your question again.",
        timestamp: new Date(),
      }]);
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
    date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={cn(
      'fixed top-0 right-0 h-screen w-[380px] max-w-full z-50',
      'flex flex-col bg-surface-1 text-text-primary border-l border-line',
      'transition-transform duration-300 ease-spring',
      isOpen ? 'translate-x-0 shadow-overlay' : 'translate-x-full'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-signal-tint iq-grad-border [--surface-1:var(--signal-tint)] text-signal-text">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-signal-text">Ask 360IQ</p>
            <p className="text-xs text-text-muted">Document intelligence</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close Ask 360IQ">
          <X size={18} />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'chat' | 'analyze')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-4 pt-3 flex-shrink-0">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1 gap-1.5">
              <MessageSquare size={16} />Chat
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex-1 gap-1.5">
              <FileSearch size={16} />Document analysis
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Chat tab ── */}
        <TabsContent value="chat" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          {/* Selected doc context bar */}
          {selectedChatDoc && (
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-line bg-field px-4 py-2">
              <FileSearch size={16} className="flex-shrink-0 text-text-secondary" />
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">Asking about {selectedChatDoc.title}</p>
              <Button variant="ghost" size="sm" onClick={() => setSelectedChatDoc(null)} aria-label="Remove document">
                <X size={14} />
              </Button>
            </div>
          )}

          {/* Add document context button */}
          {!selectedChatDoc && !showChatDocPicker && (
            <div className="flex-shrink-0 border-b border-line px-4 py-3">
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowChatDocPicker(true)}>
                <FileSearch size={14} />
                Add a document
              </Button>
            </div>
          )}

          {/* Document picker */}
          {showChatDocPicker && (
            <div className="flex-shrink-0 space-y-2.5 border-b border-line px-4 py-3">
              <div className="flex items-center justify-between">
                <p className={SECTION_LABEL}>Pick a document</p>
                <Button variant="ghost" size="sm" onClick={() => setShowChatDocPicker(false)} aria-label="Close document list">
                  <X size={14} />
                </Button>
              </div>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  type="text"
                  aria-label="Search documents"
                  placeholder="Search documents"
                  value={chatDocSearch}
                  onChange={e => setChatDocSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {chatDocsLoading && <div role="status" aria-label="Loading" className="flex items-center justify-center py-6"><Loader2 size={18} className="animate-spin text-signal-text" /></div>}
                {!chatDocsLoading && chatDocuments.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No documents found.</p>}
                {!chatDocsLoading && chatDocuments
                  .filter(d => d.title.toLowerCase().includes(chatDocSearch.toLowerCase()) || d.document_type?.toLowerCase().includes(chatDocSearch.toLowerCase()))
                  .map(doc => (
                    <button
                      type="button"
                      key={doc.id}
                      onClick={() => { setSelectedChatDoc(doc); setShowChatDocPicker(false); }}
                      className={PICKER_ROW}
                    >
                      <FileSearch size={14} className="flex-shrink-0 text-text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-text-primary">{doc.title}</span>
                        <span className="block truncate text-xs text-text-muted">{doc.document_type || doc.file_type}</span>
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="flex-1 space-y-4 overflow-y-auto scroll-smooth px-4 py-4" aria-live="polite">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {msg.role === 'assistant' && (
                  <span className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-pill bg-signal-tint text-signal-text">
                    <Sparkles size={14} />
                  </span>
                )}
                <div className="flex max-w-[82%] flex-col gap-1">
                  <div className={cn(
                    'rounded-lg px-3 py-2 text-sm leading-relaxed text-text-primary',
                    msg.role === 'user' ? 'bg-field' : 'bg-signal-tint'
                  )}>
                    {msg.role === 'assistant' ? (
                      // Render markdown for assistant messages
                      <div className="prose prose-xs max-w-none break-words prose-p:my-1 prose-headings:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                    )}
                  </div>
                  <p className={cn('font-mono text-xs text-text-muted', msg.role === 'user' ? 'text-right' : 'text-left')}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div role="status" className="flex items-center gap-2">
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-pill bg-signal-tint text-signal-text">
                  <Sparkles size={14} />
                </span>
                <p className="rounded-lg bg-signal-tint px-3 py-2 text-sm text-signal-text">360IQ is reading your question…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-line p-4">
            <div className="flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                aria-label="Ask 360IQ"
                placeholder={selectedChatDoc ? `Ask about ${selectedChatDoc.title}` : 'Ask about your documents'}
                rows={1}
                disabled={isLoading}
                className="min-h-[2.857rem] max-h-[120px] flex-1 resize-none overflow-y-auto leading-relaxed"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Send question"
                className="flex-shrink-0"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
            <p className="mt-1.5 text-center text-xs text-text-muted">Enter to send, Shift+Enter for a new line</p>
          </div>
        </TabsContent>

        {/* ── Document analysis tab ── */}
        <TabsContent value="analyze" className="flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden">
          {!selectedDoc ? (
            <div className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
              <p className={SECTION_LABEL}>Select a document</p>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  type="text"
                  aria-label="Search documents"
                  placeholder="Search documents"
                  value={docSearch}
                  onChange={e => setDocSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto">
                {docsLoading && <div role="status" aria-label="Loading" className="flex items-center justify-center py-12"><Loader2 size={20} className="animate-spin text-signal-text" /></div>}
                {!docsLoading && filteredDocs.length === 0 && (
                  <p className="py-10 text-center text-sm text-text-muted">
                    {documents.length === 0 ? 'No documents found.' : 'No results match your search.'}
                  </p>
                )}
                {!docsLoading && filteredDocs.map(doc => (
                  <button
                    type="button"
                    key={doc.id}
                    onClick={() => handleDocSelect(doc)}
                    className={PICKER_ROW}
                  >
                    <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-sm bg-field text-text-secondary">
                      <FileSearch size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">{doc.title}</span>
                      <span className="block truncate text-xs text-text-muted">{doc.document_type || doc.file_type}</span>
                    </span>
                    <ChevronRight size={14} className="flex-shrink-0 text-text-muted" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Selected doc header */}
              <div className="flex flex-shrink-0 items-center gap-2 border-b border-line px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Back to document list"
                  onClick={() => { setSelectedDoc(null); setSummary(null); setAnalysis(null); setAnalysisError(null); }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-text-primary">{selectedDoc.title}</p>
                  <p className="text-xs text-text-muted">{selectedDoc.document_type || selectedDoc.file_type}</p>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="flex-shrink-0 px-4 pb-2 pt-3">
                <Tabs
                  value={analysisMode}
                  onValueChange={(v) => { setAnalysisMode(v as AnalysisMode); setSummary(null); setAnalysis(null); setAnalysisError(null); }}
                >
                  <TabsList className="w-full" aria-label="Analysis type">
                    <TabsTrigger value="summarize" className="flex-1">Summary</TabsTrigger>
                    <TabsTrigger value="analyze" className="flex-1">Deep analysis</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 space-y-2 px-4 pb-3">
                {!summary && !analysis && !analysisLoading && (
                  <>
                    <Button className="w-full" onClick={handleRunAnalysis}>
                      <Sparkles size={16} />
                      {analysisMode === 'summarize' ? 'Summarise document' : 'Run deep analysis'}
                    </Button>
                    {analysisError && <p role="alert" className="text-center text-xs text-risk">{analysisError}</p>}
                  </>
                )}
                {(summary || analysis) && <AddToCalendarButton document={selectedDoc} />}
              </div>

              {/* Loading */}
              {analysisLoading && (
                <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3">
                  <Loader2 size={24} className="animate-spin text-signal-text" />
                  <p className="text-xs text-text-secondary">
                    360IQ is reading {selectedDoc.title}…
                  </p>
                </div>
              )}

              {/* Summary results */}
              {summary && !analysisLoading && (
                <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                  <div className={AI_PANEL}>
                    <p className={AI_PANEL_LABEL}><Sparkles size={14} />Summary</p>
                    <p className="text-sm leading-relaxed text-text-primary">{summary.summary}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-signal-text">
                      <FileSearch size={14} />Based on {selectedDoc.title}
                    </p>
                  </div>
                  {summary.key_points?.length > 0 && (
                    <div>
                      <p className={cn(SECTION_LABEL, 'mb-1.5 flex items-center gap-1')}>
                        <ListTodo size={14} /> Key points
                      </p>
                      <ul className="list-disc space-y-1 pl-4">
                        {summary.key_points.map((pt, i) => (
                          <li key={i} className="text-xs text-text-secondary">{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {summary.doc_type && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-field px-2.5 py-1 text-xs text-text-secondary">
                        <FileType size={14} />{summary.doc_type}
                      </span>
                    )}
                    {summary.language && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-field px-2.5 py-1 text-xs text-text-secondary">
                        <Globe size={14} />{summary.language}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => { setSummary(null); setAnalysisError(null); }}
                  >
                    <RotateCcw size={14} /> Run again
                  </Button>
                </div>
              )}

              {/* Deep analysis results */}
              {analysis && !analysisLoading && (
                <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    Sentiment
                    <StatusBadge tone={sentimentTone(analysis.sentiment)} className="capitalize">{analysis.sentiment}</StatusBadge>
                  </div>
                  <div className={AI_PANEL}>
                    <p className={AI_PANEL_LABEL}><Sparkles size={14} />Insights</p>
                    <p className="text-sm leading-relaxed text-text-primary">{analysis.insights}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-signal-text">
                      <FileSearch size={14} />Based on {selectedDoc.title}
                    </p>
                  </div>
                  {analysis.themes?.length > 0 && (
                    <div>
                      <p className={cn(SECTION_LABEL, 'mb-1.5 flex items-center gap-1')}>
                        <TrendingUp size={14} /> Themes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.themes.map((t, i) => (
                          <span key={i} className="rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-secondary">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.entities?.length > 0 && (
                    <div>
                      <p className={cn(SECTION_LABEL, 'mb-1.5 flex items-center gap-1')}>
                        <Users size={14} /> Entities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.entities.map((e, i) => (
                          <span key={i} className="rounded-pill bg-field px-2.5 py-0.5 text-xs text-text-secondary">{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.action_items?.length > 0 && (
                    <div>
                      <p className={cn(SECTION_LABEL, 'mb-1.5 flex items-center gap-1')}>
                        <Tag size={14} /> Action items
                      </p>
                      <ul className="list-disc space-y-1 pl-4">
                        {analysis.action_items.map((a, i) => (
                          <li key={i} className="text-xs text-text-secondary">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => { setAnalysis(null); setAnalysisError(null); }}
                  >
                    <RotateCcw size={14} /> Run again
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
