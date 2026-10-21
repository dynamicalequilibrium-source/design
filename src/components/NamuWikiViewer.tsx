import React, { useState, useRef } from 'react';
import { WikiDocument, WikiSentence, WikiBlock } from '../types/wiki';
import { NamuWikiInfoBox } from './NamuWikiInfoBox';
import { 
  List, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  HelpCircle,
  ExternalLink,
  MessageCircleQuestion,
  Sparkles,
  Link2,
  FileText
} from 'lucide-react';

interface NamuWikiViewerProps {
  document: WikiDocument;
  onSentenceClick: (sentence: WikiSentence, block: WikiBlock) => void;
  onOpenQuickQuestion: () => void;
  fontSize: number;
}

export const NamuWikiViewer: React.FC<NamuWikiViewerProps> = ({
  document,
  onSentenceClick,
  onOpenQuickQuestion,
  fontSize
}) => {
  const [isTocOpen, setIsTocOpen] = useState(true);
  const [activeFootnote, setActiveFootnote] = useState<number | null>(null);
  const isDraggingRef = useRef(false);

  // Scroll to section handler
  const handleScrollToSection = (blockId: string) => {
    const el = window.document.getElementById(blockId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Safe sentence click handler that ignores text dragging/selection
  const handleSentenceClickSafe = (e: React.MouseEvent, sentence: WikiSentence, block: WikiBlock) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // User is copying text, don't open modal
      return;
    }
    onSentenceClick(sentence, block);
  };

  return (
    <article 
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 bg-white min-h-screen shadow-xs text-slate-800"
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Wiki Document Top Header */}
      <div className="border-b-2 border-[#00a495] pb-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-emerald-700 font-semibold mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00a495]" />
              공식 행정 인수인계 위키 지침서
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {document.title}
            </h1>
          </div>

          {/* NamuWiki Action Buttons */}
          <div className="flex items-center gap-1.5 self-start md:self-auto text-xs shrink-0 flex-wrap">
            <button 
              onClick={() => alert('바통위키 역링크: 본 문서를 참조하고 있는 타 업무 지침서(기획재정팀 결산서, 예산편성안 등 4건)가 있습니다.')}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5 text-slate-500" /> 역링크
            </button>
            <button 
              onClick={() => alert('인수인계 토론: 현재 3건의 실무 지침 개정 건의가 토론 중에 있습니다.')}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" /> 토론 (3)
            </button>
            <button 
              onClick={() => alert('편집 모드: 인수인계서 수정 권한은 전임자(김책임) 및 신임자(이선임)에게만 부여되어 있습니다.')}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              편집
            </button>
            <button 
              onClick={() => alert('문서 역사: v4.2(현재) - 2026.10.18 바통 Q&A 답변 2건 본문 반영 승인 완료')}
              className="px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              역사
            </button>
          </div>
        </div>

        {/* Notice Banner (바통위키 특유의 안내 틀) */}
        <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#00a495] shrink-0 mt-0.5" />
          <div className="text-slate-700 leading-relaxed">
            <span className="font-bold text-emerald-800">[안내] </span>
            본 문서는 <strong className="text-slate-900">2026년도 신임 담당자</strong>를 위한 인수인계 지침서입니다. 
            문서 내 <span className="bg-emerald-100/80 text-emerald-900 font-semibold px-1 rounded border-b border-emerald-400">초록색 하이라이트 문장</span>이나 
            우측의 <span className="font-bold text-[#008275]">바통 Q&A 배지</span>를 클릭하면, 
            선배들이 남긴 <span className="font-bold text-[#008275]">바통 Q&A 실무 질의응답 및 근거 행정지침</span>을 열람하실 수 있습니다.
          </div>
        </div>
      </div>

      {/* Main Content Layout with Floating InfoBox on right */}
      <div className="clearfix">
        
        {/* Right InfoBox */}
        <NamuWikiInfoBox 
          infoBox={document.infoBox} 
          onOpenQuickQuestion={onOpenQuickQuestion}
        />

        {/* NamuWiki Table of Contents (TOC) */}
        <div className="mb-8 w-full md:w-80 bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
              <List className="w-3.5 h-3.5 text-[#00a495]" />
              <span>목차 (TOC)</span>
            </div>
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className="text-[11px] text-[#00a495] hover:underline font-medium flex items-center gap-0.5 cursor-pointer"
            >
              [{isTocOpen ? '접기' : '펼치기'}]
            </button>
          </div>

          {isTocOpen && (
            <nav className="mt-2 text-xs space-y-1.5 text-slate-700">
              {document.blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleScrollToSection(block.id)}
                  className="w-full text-left hover:text-[#00a495] hover:underline transition flex items-center gap-1.5 cursor-pointer py-0.5"
                >
                  <span className="font-bold text-slate-500 font-mono text-[11px] shrink-0">
                    {block.sectionNumber}
                  </span>
                  <span className="truncate">{block.title || '내용'}</span>
                </button>
              ))}
              <button
                onClick={() => handleScrollToSection('footnotes-section')}
                className="w-full text-left hover:text-[#00a495] hover:underline transition flex items-center gap-1.5 cursor-pointer py-0.5 text-slate-500"
              >
                <span className="font-bold text-slate-400 font-mono text-[11px] shrink-0">7.</span>
                <span>각주 및 관련 근거 법령</span>
              </button>
            </nav>
          )}
        </div>

        {/* Wiki Blocks & Sections */}
        <div className="space-y-8">
          {document.blocks.map((block) => (
            <section key={block.id} id={block.id} className="scroll-mt-20">
              
              {/* Section Heading */}
              {block.title && (
                <div className="border-b border-slate-200 pb-1.5 mb-3.5 flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-[#00a495] font-mono">{block.sectionNumber}</span>
                    <span>{block.title}</span>
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    [편집]
                  </span>
                </div>
              )}

              {/* Table Block (NamuWiki Style) */}
              {block.type === 'table' ? (
                <div className="space-y-3">
                  {block.sentences.length > 0 && (
                    <div className="text-slate-800 leading-relaxed">
                      {block.sentences.map(sentence => (
                        <p key={sentence.id} className="mb-1.5">
                          <span className={sentence.isBold ? 'font-bold' : ''}>
                            {sentence.text}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}

                  {block.tableData && (
                    <div className="my-3 overflow-x-auto">
                      {block.tableData.title && (
                        <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#00a495]" />
                          <span>{block.tableData.title}</span>
                        </div>
                      )}
                      <table className="w-full text-xs border-collapse border border-slate-300 rounded-lg overflow-hidden text-left shadow-2xs">
                        <thead>
                          <tr className="bg-[#00a495] text-white">
                            {block.tableData.columns.map((col, idx) => (
                              <th key={idx} className="p-2.5 font-bold border border-[#008275] text-center whitespace-nowrap text-[11px]">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {block.tableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-slate-50/70 hover:bg-emerald-50/40' : 'bg-white hover:bg-emerald-50/40'}>
                              {row.cells.map((cell, cIdx) => (
                                <td 
                                  key={cell.id} 
                                  className={`p-2.5 border border-slate-200 leading-relaxed ${
                                    cIdx === 0 ? 'text-center font-bold text-slate-700 bg-slate-50/80 w-14 whitespace-nowrap' : ''
                                  } ${cIdx === 1 ? 'font-semibold text-slate-900 whitespace-nowrap' : ''} ${
                                    cIdx === 2 || cIdx === 3 ? 'text-slate-600 whitespace-nowrap text-center text-[11px]' : ''
                                  } ${cIdx === 5 ? 'text-center whitespace-nowrap' : ''}`}
                                >
                                  {cell.hasQuestions ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const targetSentenceId = cell.id.includes('3') ? 's-3-4' : cell.id.includes('4') ? 's-4-2' : 's-5-2';
                                        const mockSentence: WikiSentence = {
                                          id: targetSentenceId,
                                          text: cell.text,
                                          hasQuestions: true,
                                          questionCount: cell.questionCount
                                        };
                                        onSentenceClick(mockSentence, block);
                                      }}
                                      className="inline-flex items-center gap-1 text-slate-900 hover:text-[#008275] hover:underline cursor-pointer text-left"
                                      title="클릭하여 바통 Q&A 확인"
                                    >
                                      <span className={cell.isBold ? 'font-bold' : ''}>{cell.text}</span>
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[#00a495] hover:bg-[#008275] text-white text-[10px] font-bold shrink-0 shadow-2xs">
                                        <MessageSquare className="w-2.5 h-2.5" /> Q&A {cell.questionCount}
                                      </span>
                                    </button>
                                  ) : (
                                    <span className={cell.isBold ? 'font-bold' : ''}>{cell.text}</span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : block.type === 'alert' ? (
                /* NamuWiki Tip / Warning Box */
                <div className="p-4 rounded-xl bg-amber-50/70 border-2 border-amber-300 text-slate-800 space-y-2 my-4 shadow-2xs">
                  {block.alertTitle && (
                    <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>{block.alertTitle}</span>
                    </div>
                  )}
                  <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-amber-950">
                    {block.sentences.map((sentence) => (
                      <div key={sentence.id} className="flex items-start gap-1.5">
                        <span>{sentence.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Regular Wiki Paragraph */
                <div className="text-slate-800 leading-relaxed space-y-2">
                  <p className="inline leading-relaxed">
                    {block.sentences.map((sentence) => {
                      const hasQ = sentence.hasQuestions;

                      return (
                        <span
                          key={sentence.id}
                          onClick={(e) => handleSentenceClickSafe(e, sentence, block)}
                          className={`inline transition-colors relative group py-0.5 px-0.5 rounded cursor-pointer ${
                            hasQ
                              ? 'bg-emerald-50/90 hover:bg-emerald-100 text-slate-900 border-b-2 border-[#00a495] font-normal'
                              : 'hover:bg-slate-100'
                          } ${sentence.isBold ? 'font-bold' : ''} ${
                            sentence.isStrikeThrough ? 'line-through text-slate-400 decoration-slate-400' : ''
                          }`}
                          title={hasQ ? '클릭하여 바통 Q&A 및 근거 보기' : '클릭하여 이 문장에 질문하기'}
                        >
                          {sentence.text}

                          {/* Footnote Tag [1] */}
                          {sentence.footnoteNumber && (
                            <sup 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScrollToSection('footnotes-section');
                              }}
                              className="text-[11px] text-[#00a495] font-bold hover:underline ml-0.5 cursor-pointer font-mono"
                              title="각주 확인하기"
                            >
                              [{sentence.footnoteNumber}]
                            </sup>
                          )}

                          {/* Q&A Badge Icon if Questions exist */}
                          {hasQ && (
                            <span 
                              className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.2 rounded-full bg-[#00a495] hover:bg-[#008275] text-white text-[10px] font-bold shadow-2xs align-middle"
                              title="바통 Q&A 답변 열람"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span className="hidden sm:inline">Q&A</span> {sentence.questionCount}
                            </span>
                          )}

                          {/* Hover Tooltip */}
                          <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[10px] rounded shadow-lg whitespace-nowrap z-20">
                            {hasQ ? `💬 바통 Q&A ${sentence.questionCount}건 열기` : '❓ 이 문장에 질문 등록'}
                          </span>
                        </span>
                      );
                    })}
                  </p>

                  {/* Paragraph-level question trigger on the right */}
                  <div className="pt-1 flex items-center justify-end gap-2 text-[11px]">
                    <button
                      onClick={() => onSentenceClick(block.sentences[0], block)}
                      className="text-slate-400 hover:text-[#00a495] transition flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircleQuestion className="w-3 h-3" />
                      <span>문단 질문하기</span>
                    </button>
                  </div>
                </div>
              )}

            </section>
          ))}
        </div>

        {/* NamuWiki Footnotes Section */}
        <section id="footnotes-section" className="mt-12 pt-6 border-t border-slate-200 text-xs">
          <div className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#00a495]" />
            <span>각주 및 관련 근거 법령</span>
          </div>
          <div className="space-y-1.5 text-slate-600 pl-2">
            {document.footnotes.map((fn) => (
              <div key={fn.number} className="flex items-start gap-2">
                <span className="font-mono font-bold text-[#00a495] shrink-0">
                  [{fn.number}]
                </span>
                <span className="leading-relaxed">{fn.text}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </article>
  );
};
