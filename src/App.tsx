/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MOCK_WIKI_DOCUMENTS, MOCK_KIN_THREADS } from './data/mockWikiData';
import { WikiDocument, WikiSentence, WikiBlock, KinThread, KinAnswer } from './types/wiki';
import { NamuWikiHeader } from './components/NamuWikiHeader';
import { NamuWikiViewer } from './components/NamuWikiViewer';
import { NaverKinModal } from './components/NaverKinModal';
import { QuickHelpGuide } from './components/QuickHelpGuide';

export default function App() {
  const [documents, setDocuments] = useState<WikiDocument[]>(MOCK_WIKI_DOCUMENTS);
  const [currentDocId, setCurrentDocId] = useState<string>('doc-subsidy-2026');
  const [threads, setThreads] = useState<Record<string, KinThread>>(MOCK_KIN_THREADS);

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
        setActiveSentence(null);
        setActiveBlock(null);
        setIsHelpOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle sentence click
  const handleSentenceClick = (sentence: WikiSentence, block: WikiBlock) => {
    setActiveSentence(sentence);
    setActiveBlock(block);
  };

  // Close Naver Kin Modal
  const handleCloseModal = () => {
    setActiveSentence(null);
    setActiveBlock(null);
  };

  // Add Answer to Thread
  const handleAddAnswer = (
    threadId: string, 
    answerText: string, 
    evidenceTitle: string, 
    evidenceLoc: string
  ) => {
    const targetThreadKey = Object.keys(threads).find(k => threads[k].id === threadId);
    if (!targetThreadKey) return;

    const newAnswer: KinAnswer = {
      id: `ans-${Date.now()}`,
      author: {
        name: '선임담당자_이책임',
        role: '실무 선배',
        level: '달신',
        badge: '🌙 달신',
        department: '청년창업지원과',
        adoptRate: 91.5,
        avatarColor: 'bg-teal-600'
      },
      content: answerText,
      createdAt: '방금 전',
      isAdopted: false,
      isOfficialReviewed: true,
      reviewNote: evidenceTitle ? `${evidenceTitle} 근거 검토 완료` : undefined,
      likes: 1,
      userLiked: true,
      evidenceLinks: evidenceTitle ? [
        {
          title: evidenceTitle,
          sourceType: '업무매뉴얼',
          referenceLocation: evidenceLoc || '상세 조항'
        }
      ] : [],
      comments: []
    };

    setThreads(prev => ({
      ...prev,
      [targetThreadKey]: {
        ...prev[targetThreadKey],
        answers: [...prev[targetThreadKey].answers, newAnswer]
      }
    }));
  };

  // Create New Thread for a sentence
  const handleCreateThread = (
    sentenceId: string, 
    quote: string, 
    title: string, 
    content: string
  ) => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: KinThread = {
      id: newThreadId,
      documentId: currentDoc.id,
      blockId: activeBlock?.id || 'block-01',
      sentenceId,
      sentenceQuote: quote,
      title,
      content,
      author: {
        name: '신임이선임_2026',
        role: '신임 인수자',
        level: '초보',
        badge: '새싹',
        department: '청년창업지원과',
        avatarColor: 'bg-emerald-500'
      },
      createdAt: '방금 전',
      views: 1,
      empathyCount: 1,
      userEmpathized: true,
      status: 'WAITING',
      tags: ['업무인수인계', '실무질문', '후임자QnA'],
      answers: []
    };

    // Update threads record
    setThreads(prev => ({
      ...prev,
      [sentenceId]: newThread
    }));

    // Update document sentence metadata (mark hasQuestions: true)
    setDocuments(prevDocs => 
      prevDocs.map(doc => {
        if (doc.id !== currentDoc.id) return doc;
        return {
          ...doc,
          blocks: doc.blocks.map(b => ({
            ...b,
            sentences: b.sentences.map(s => {
              if (s.id === sentenceId) {
                return {
                  ...s,
                  hasQuestions: true,
                  questionCount: (s.questionCount || 0) + 1
                };
              }
              return s;
            })
          }))
        };
      })
    );
  };

  // Toggle Empathy (나도 궁금해요)
  const handleToggleEmpathy = (threadId: string) => {
    const targetKey = Object.keys(threads).find(k => threads[k].id === threadId);
    if (!targetKey) return;

    setThreads(prev => {
      const thread = prev[targetKey];
      const isEmpathized = !!thread.userEmpathized;
      return {
        ...prev,
        [targetKey]: {
          ...thread,
          userEmpathized: !isEmpathized,
          empathyCount: isEmpathized ? Math.max(0, thread.empathyCount - 1) : thread.empathyCount + 1
        }
      };
    });
  };

  // Toggle Answer Like
  const handleToggleAnswerLike = (threadId: string, answerId: string) => {
    const targetKey = Object.keys(threads).find(k => threads[k].id === threadId);
    if (!targetKey) return;

    setThreads(prev => {
      const thread = prev[targetKey];
      const updatedAnswers = thread.answers.map(ans => {
        if (ans.id !== answerId) return ans;
        const liked = !!ans.userLiked;
        return {
          ...ans,
          userLiked: !liked,
          likes: liked ? Math.max(0, ans.likes - 1) : ans.likes + 1
        };
      });

      return {
        ...prev,
        [targetKey]: {
          ...thread,
          answers: updatedAnswers
        }
      };
    });
  };

  // Add Comment to an Answer
  const handleAddComment = (threadId: string, answerId: string, commentText: string) => {
    const targetKey = Object.keys(threads).find(k => threads[k].id === threadId);
    if (!targetKey) return;

    setThreads(prev => {
      const thread = prev[targetKey];
      const updatedAnswers = thread.answers.map(ans => {
        if (ans.id !== answerId) return ans;
        return {
          ...ans,
          comments: [
            ...ans.comments,
            {
              id: `c-${Date.now()}`,
              author: '신임이선임_2026',
              content: commentText,
              createdAt: '방금 전'
            }
          ]
        };
      });

      return {
        ...prev,
        [targetKey]: {
          ...thread,
          answers: updatedAnswers
        }
      };
    });
  };

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
  const currentThread = activeSentence ? threads[activeSentence.id] : undefined;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-slate-800">
      
      {/* 1. NamuWiki Header with Search & Tooling */}
      <NamuWikiHeader
        document={currentDoc}
        documents={documents}
        onSelectDocument={(docId) => setCurrentDocId(docId)}
        onOpenQuickQuestion={handleOpenQuickQuestion}
        onSearchSelect={handleSearchSelect}
        fontSize={fontSize}
        onChangeFontSize={handleChangeFontSize}
        onToggleHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Main Wiki Body Viewer */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        <NamuWikiViewer
          document={currentDoc}
          onSentenceClick={handleSentenceClick}
          onOpenQuickQuestion={handleOpenQuickQuestion}
          fontSize={fontSize}
        />
      </main>

      {/* 3. Naver JiSik-iN Modal (Sentence Click) */}
      {activeSentence && activeBlock && (
        <NaverKinModal
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
