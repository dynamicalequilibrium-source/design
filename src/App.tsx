/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WikiDocument, WikiSentence, WikiBlock, KinThread } from './types/wiki';
import { NamuWikiHeader } from './components/NamuWikiHeader';
import { NamuWikiViewer } from './components/NamuWikiViewer';
import { NaverKinModal } from './components/NaverKinModal';
import { loadState, saveMutation } from './api';
import { QuickHelpGuide } from './components/QuickHelpGuide';

export default function App() {
  const [documents, setDocuments] = useState<WikiDocument[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('doc-subsidy-2026');
  const [threads, setThreads] = useState<Record<string, KinThread>>({});

  // Active sentence & block for Naver Kin modal
  const [activeSentence, setActiveSentence] = useState<WikiSentence | null>(null);
  const [activeBlock, setActiveBlock] = useState<WikiBlock | null>(null);

  // Font size setting (14px ~ 20px)
  const [fontSize, setFontSize] = useState<number>(15);

  // Help modal
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Find active document
  const currentDoc = documents.find(d => d.id === currentDocId) || documents[0];

  // Close modals on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle sentence click
  const handleSentenceClick = (sentence: WikiSentence, block: WikiBlock) => {
    setSelectedThreadId('');
    setActiveSentence(sentence);
    setActiveBlock(block);
  };

  // Close Naver Kin Modal
  const handleCloseModal = () => {
    setActiveSentence(null);
    setActiveBlock(null);
    requestAnimationFrame(() => window.document.getElementById(`sentence-${activeSentence?.id}`)?.focus({preventScroll: true}));
  };

  const [loadError, setLoadError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState('');
  useEffect(() => {
    loadState().then(data => {
      setDocuments(data.documents);
      setThreads(data.threads);
      setLoaded(true);
    }).catch(() => setLoadError('서버에 연결하지 못했습니다. API 서버를 실행한 뒤 새로고침해 주세요.'));
  }, []);

  const save = async (payload: Record<string, string>) => {
    const result = await saveMutation(payload);
    setThreads(prev => ({...prev, [result.thread.id]: result.thread}));
    setSelectedThreadId(result.thread.id);
  };
  const handleAddAnswer = async (threadId: string, content: string, evidenceTitle: string, evidenceLoc: string) => {
    await save({action: 'answer', threadId, content, evidenceTitle, evidenceLoc});
  };
  const handleCreateThread = async (sentenceId: string, quote: string, title: string, content: string) => {
    if (!activeBlock) throw new Error('질문 대상 문단을 선택해 주세요.');
    await save({action: 'question', documentId: currentDoc.id, blockId: activeBlock.id, sentenceId, quote, title, content});
  };
  const handleAddComment = async (threadId: string, answerId: string, content: string) => {
    await save({action: 'comment', threadId, answerId, content});
  };
  // Popularity reactions are outside the first vertical slice.
  const handleToggleEmpathy = () => {};
  const handleToggleAnswerLike = () => {};

  // Quick question trigger from header or infobox
  const handleOpenQuickQuestion = () => {
    // Pick the most critical highlight sentence
    const targetBlock = currentDoc.blocks.find(b => b.sentences.some(s => s.id === 's-3-2')) || currentDoc.blocks[0];
    const targetSentence = targetBlock.sentences.find(s => s.id === 's-3-2') || targetBlock.sentences[0];
    setActiveSentence(targetSentence);
    setActiveBlock(targetBlock);
  };

  // Search Select handler
  const handleSearchSelect = (type: 'sentence' | 'qna', id: string) => {
    const targetBlock = currentDoc.blocks.find(b => b.sentences.some(s => s.id === id));
    if (targetBlock) {
      const targetSentence = targetBlock.sentences.find(s => s.id === id);
      if (targetSentence) {
        // Scroll to block
        const el = window.document.getElementById(targetBlock.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Open modal
        setActiveSentence(targetSentence);
        setActiveBlock(targetBlock);
      }
    }
  };

  // Font size adjustment
  const handleChangeFontSize = (delta: number) => {
    setFontSize(prev => Math.min(20, Math.max(13, prev + delta)));
  };

  // Active thread for current active sentence
  const sentenceThreads = activeSentence ? Object.values(threads).filter(t => t.documentId === currentDoc.id && t.blockId === activeBlock?.id && t.sentenceId === activeSentence.id) : [];
  const currentThread = sentenceThreads.find(t => t.id === selectedThreadId) || sentenceThreads[0];
  const displayDoc = currentDoc && {...currentDoc, blocks: currentDoc.blocks.map(b => ({...b, sentences: b.sentences.map(s => {
    const count = Object.values(threads).filter(t => t.documentId === currentDoc.id && t.blockId === b.id && t.sentenceId === s.id).length;
    return {...s, hasQuestions: count > 0, questionCount: count};
  })}))};
  if (!loaded) return <main className="p-8" role="status">{loadError || '서버에서 업무문서를 불러오고 있습니다…'}</main>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-slate-800">
      
      {/* 1. NamuWiki Header with Search & Tooling */}
      <NamuWikiHeader
        document={currentDoc}
        documents={documents}
        onSelectDocument={(docId) => {setCurrentDocId(docId); handleCloseModal();}}
        onOpenQuickQuestion={handleOpenQuickQuestion}
        onSearchSelect={handleSearchSelect}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        onToggleHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Main Wiki Body Viewer */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        <NamuWikiViewer
          document={displayDoc}
          onSentenceClick={handleSentenceClick}
          onOpenQuickQuestion={handleOpenQuickQuestion}
          fontSize={fontSize}
        />
      </main>

      {/* 3. Naver JiSik-iN Modal (Sentence Click) */}
      {activeSentence && activeBlock && (
        <NaverKinModal
          key={`${currentDoc.id}:${activeSentence.id}`}
          draftKey={`${currentDoc.id}:${activeBlock.id}:${activeSentence.id}`}
          threads={sentenceThreads}
          onSelectThread={setSelectedThreadId}
          sentence={activeSentence}
          block={activeBlock}
          thread={currentThread}
          onClose={handleCloseModal}
          onAddAnswer={handleAddAnswer}
          onCreateThread={handleCreateThread}
          onToggleEmpathy={handleToggleEmpathy}
          onToggleAnswerLike={handleToggleAnswerLike}
          onAddComment={handleAddComment}
        />
      )}

      {/* 4. Quick Help Guide Modal */}
      {isHelpOpen && (
        <QuickHelpGuide onClose={() => setIsHelpOpen(false)} />
      )}

      {/* 5. NamuWiki Classic Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-bold text-slate-700">
              업무 바통 (Baton Wiki) · 바통위키 인수인계 & 바통 Q&A 지식 시스템
            </div>
            <p className="text-[11px] text-slate-400">
              본 시스템의 모든 콘텐츠는 가상 시뮬레이션 데이터이며, 행정안전부 및 기획재정부 국고보조금 지침을 참조하여 제작되었습니다.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>크리에이티브 커먼즈 저작자표시 2.0</span>
            <span>·</span>
            <span>이용약관</span>
            <span>·</span>
            <span>개인정보처리방침</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

