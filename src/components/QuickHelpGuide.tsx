import React from 'react';
import { X, BookOpen, MessageSquare, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface QuickHelpGuideProps {
  onClose: () => void;
}

export const QuickHelpGuide: React.FC<QuickHelpGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#00a495] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-sm sm:text-base">업무 바통 (Baton Wiki) 이용 안내</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed overflow-y-auto max-h-[75vh]">
          
          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <BookOpen className="w-5 h-5 text-[#00a495] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 mb-1">1. 바통위키 스타일 인수인계서 열람</h4>
              <p className="text-slate-600">
                인포박스, 목차, 각주, 취소선 등 바통위키 특유의 정형화된 레이아웃을 통해 방대한 업무 인수인계 규정을 빠르고 체계적으로 훑어볼 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <FileText className="w-5 h-5 text-[#00a495] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 mb-1">2. 실무 문서 표준 서식 & 단계별 절차표</h4>
              <p className="text-slate-600">
                업무 추진 절차서, 필수 확인 서류, 관련 규정 조항을 바통위키 고유의 체계적인 본문 글과 표준 표(Table) 형태로 꼼꼼히 확인합니다.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <MessageSquare className="w-5 h-5 text-[#00a495] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 mb-1">3. 문장별 바통 Q&A 질의응답</h4>
              <p className="text-slate-600">
                궁금한 문장이나 초록색 하이라이트 문장을 클릭하면 <strong>바통 Q&A 모달창</strong>이 열립니다. 
                선배들의 <strong>질문자 채택 답변</strong>, 근거 법령, 실시간 질의 등록 및 댓글을 직접 남겨보세요!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 mb-1">4. 공식 검토 및 본문 피드백 루프</h4>
              <p className="text-slate-600">
                바통 Q&A에 쌓인 신뢰도 높은 답변은 '공식 담당자 검토'를 거쳐 차기 인수인계 위키 본문 지침으로 정식 승계됩니다.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00a495] hover:bg-[#008275] text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
