import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, FileSearch, MessageSquare, Loader2, Bot, Search, ChevronRight, RotateCcw, TrendingUp, Tag, Users, Smile, ListTodo, Globe, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { list, post } from '@/lib/api/crud';
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
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm your AI document assistant. I can help you summarize documents, extract key insights, and answer questions about your data. How can I help you today?",
  timestamp: new Date(),
};

type AnalysisMode = 'summarize' | 'analyze';

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analyze'>('analyze');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Fetch documents when analyze tab is opened
  useEffect(() => {
    if (activeTab !== 'analyze' || documents.length > 0) return;
    setDocsLoading(true);
    list('DOCUMENTS')
      .then((data: any) => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false));
  }, [activeTab]);

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

  // Auto-resize textarea
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

    // TODO: wire to POST /api/v1/ai/chat once backend endpoint is ready
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'The AI chat endpoint is not yet connected. Once the backend `/api/v1/ai/chat` endpoint is configured, I will respond with real AI-powered answers.',
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 900);
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

      {/* Tab header - hidden, only showing Doc Analysis */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-gray-50/60">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <FileSearch className="h-3.5 w-3.5" />
          Document Analysis
        </p>
      </div>



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

              {/* Run button */}
              {!summary && !analysis && !analysisLoading && (
                <div className="px-4 pb-3 flex-shrink-0">
                  <button
                    onClick={handleRunAnalysis}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-[#1e3c21] to-[#2a5230] text-white text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {analysisMode === 'summarize' ? 'Generate Summary' : 'Run Deep Analysis'}
                  </button>
                  {analysisError && (
                    <p className="mt-2 text-xs text-red-500 text-center">{analysisError}</p>
                  )}
                </div>
              )}

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
