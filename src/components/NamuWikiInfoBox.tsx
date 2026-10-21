import React, { useState } from 'react';
import { WikiInfoBox } from '../types/wiki';
import { ChevronDown, ChevronUp, ShieldCheck, ExternalLink, Bookmark } from 'lucide-react';

interface NamuWikiInfoBoxProps {
  infoBox: WikiInfoBox;
  onOpenQuickQuestion: () => void;
}

export const NamuWikiInfoBox: React.FC<NamuWikiInfoBoxProps> = ({ infoBox, onOpenQuickQuestion }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className="w-full lg:w-80 shrink-0 lg:ml-6 mb-6 float-none lg:float-right clear-right">
      <div className="border-2 border-[#00a495] rounded-xl overflow-hidden bg-white shadow-sm text-xs">
        
        {/* Infobox Header */}
        <div className="bg-[#00a495] text-white p-3 text-center relative">
          <div className="flex items-center justify-center gap-1.5 font-bold text-sm tracking-tight">
            <ShieldCheck className="w-4 h-4 text-emerald-200" />
            <span>{infoBox.title}</span>
          </div>
          <p className="text-[11px] text-emerald-100/90 mt-0.5">{infoBox.subtitle}</p>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden absolute right-2.5 top-3 p-1 rounded hover:bg-white/10 text-white"
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Infobox Emblem / Badge */}
        {!isCollapsed && (
          <>
            <div className="bg-emerald-50/70 border-b border-emerald-100 p-3 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#008275] to-[#00a495] flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white mb-1.5">
                {infoBox.emblemText.substring(0, 2)}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#008275]">
                {infoBox.emblemText}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                정부보조사업 인수인계 표준 서식
              </span>
            </div>

            {/* Infobox Key-Value Rows */}
            <div className="divide-y divide-slate-100">
              {infoBox.items.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col sm:flex-row sm:items-start p-2.5 gap-1.5 ${
                    index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <span className="font-semibold text-slate-600 sm:w-24 shrink-0 text-[11px]">
                    {item.label}
                  </span>
                  <div className="text-slate-800 break-words flex-1 leading-snug">
                    {item.isLink ? (
                      <span className="text-[#0275d8] hover:underline cursor-pointer inline-flex items-center gap-1 font-medium">
                        {item.value}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </span>
                    ) : (
                      <span>{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Infobox Action */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={onOpenQuickQuestion}
                className="w-full py-1.5 bg-[#00a495] hover:bg-[#008275] text-white text-[11px] font-bold rounded-md shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>인수인계 문의 바통 Q&A에 등록</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
