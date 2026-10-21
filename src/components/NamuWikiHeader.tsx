import React, { useState } from 'react';
import { 
  Search, 
  BookOpen, 
  History, 
  Edit3, 
  MessageSquare, 
  Star, 
  Printer, 
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { WikiDocument } from '../types/wiki';

interface NamuWikiHeaderProps {
  document: WikiDocument;
  documents: WikiDocument[];
  onSelectDocument: (docId: string) => void;
  onOpenQuickQuestion: () => void;
  onSearchSelect: (type: 'sentence' | 'qna', id: string) => void;
  fontSize: number;
  onChangeFontSize: (delta: number) => void;
  onToggleHelp: () => void;
}

export const NamuWikiHeader: React.FC<NamuWikiHeaderProps> = ({
  document,
  documents,
  onSelectDocument,
  onOpenQuickQuestion,
  onSearchSelect,
  fontSize,
  onChangeFontSize,
  onToggleHelp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(true);

  // Search through blocks and sentences
  const searchResults = searchQuery.trim().length > 1
    ? document.blocks.flatMap(b => 
        b.sentences.filter(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(s => ({
            type: 'sentence' as const,
            id: s.id,
            section: `${b.sectionNumber} ${b.title || ''}`,
            text: s.text,
            hasQuestions: s.hasQuestions,
            questionCount: s.questionCount
          }))
      )
    : [];

  return (
    <header className="sticky top-0 z-30 bg-[#00a495] text-white shadow-md">
      {/* NamuWiki Top Global Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-13 gap-4">
          
          {/* Logo & Document Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => onSelectDocument(document.id)}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/30 flex items-center justify-center font-black tracking-wider text-sm shadow-inner group-hover:bg-white/25 transition">
                <span className="text-white">W</span>
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base tracking-tight text-white block">
                  BATON <span className="text-emerald-200">WIKI</span>
                </span>
                <span className="text-[10px] text-white/70 tracking-widest uppercase block -mt-0.5">
                  바통위키 업무 인수인계
                </span>
              </div>
            </button>

            {/* Document Select Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 text-xs font-medium text-white/90 transition cursor-pointer border border-white/10"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline max-w-[140px] truncate">인수인계서 선택</span>
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>

              {isDocDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDocDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 mt-1 w-72 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                      인수인계서 문서 목록
                    </div>
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          onSelectDocument(doc.id);
                          setIsDocDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 hover:bg-slate-50 transition cursor-pointer ${
                          doc.id === document.id ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 mt-0.5 text-[#00a495] shrink-0" />
                        <div>
                          <div className="line-clamp-1">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">버전: {doc.version}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Wiki Quick Search Bar */}
          <div className="relative flex-1 max-w-md mx-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="인수인계서 본문 및 바통 Q&A 질문 검색..."
                className="w-full bg-white/95 focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-full pl-9 pr-8 py-1.5 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-300 transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Dropdown Results */}
            {isSearchOpen && searchResults.length > 0 && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsSearchOpen(false)} 
                />
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto">
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 flex justify-between">
                    <span>검색 결과 ({searchResults.length}건)</span>
                    <span className="text-[10px] text-emerald-600">클릭 시 해당 문장으로 이동</span>
                  </div>
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSearchSelect(item.type, item.id);
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/60 border-b border-slate-100 last:border-0 transition flex flex-col gap-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-emerald-700">{item.section}</span>
                        {item.hasQuestions && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                            <MessageSquare className="w-2.5 h-2.5" /> Q&A {item.questionCount}건
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {item.text}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Action Icons & Tools */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            {/* Font Size Adjuster */}
            <div className="hidden md:flex items-center bg-black/20 rounded px-1.5 py-0.5 border border-white/10 text-white/90">
              <span className="text-[11px] mr-1 text-white/70">글자</span>
              <button 
                onClick={() => onChangeFontSize(-1)}
                className="px-1.5 py-0.5 hover:bg-white/20 rounded font-bold cursor-pointer"
                title="글자 작게"
              >
                가-
              </button>
              <span className="text-[10px] text-emerald-200 mx-0.5">{fontSize}px</span>
              <button 
                onClick={() => onChangeFontSize(1)}
                className="px-1.5 py-0.5 hover:bg-white/20 rounded font-bold cursor-pointer"
                title="글자 크게"
              >
                가+
              </button>
            </div>

            {/* Quick Question Trigger */}
            <button
              onClick={onOpenQuickQuestion}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#008275] hover:bg-[#007065] text-white font-bold rounded-full shadow-xs transition cursor-pointer border border-white/20"
              title="바통 Q&A 질문하기"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span className="hidden sm:inline">바통 Q&A 질문</span>
            </button>

            {/* Help / Guide */}
            <button
              onClick={onToggleHelp}
              className="p-1.5 rounded hover:bg-white/15 text-white/90 transition cursor-pointer"
              title="인수인계서 사용법 안내"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Print Mode */}
            <button
              onClick={() => window.print()}
              className="p-1.5 rounded hover:bg-white/15 text-white/90 transition cursor-pointer hidden sm:block"
              title="인쇄 및 PDF 내보내기"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* NamuWiki Category Breadcrumb Bar */}
      <div className="bg-[#008275] border-t border-white/10 px-4 sm:px-6 py-1.5 text-xs text-white/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
            <span className="font-semibold text-emerald-100">분류:</span>
            {document.categories.map((cat, idx) => (
              <React.Fragment key={cat}>
                <span className="text-white hover:underline cursor-pointer bg-black/10 px-1.5 py-0.5 rounded">
                  {cat}
                </span>
                {idx < document.categories.length - 1 && <span className="text-white/40">|</span>}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-100/90">
            <span>최근 수정: <span className="text-white">{document.lastModified}</span></span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline">조회수: <span className="text-white">{document.viewCount.toLocaleString()}회</span></span>
            <span className="hidden md:inline">·</span>
            <span className="font-semibold text-emerald-200">{document.version}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
