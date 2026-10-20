import React, { useEffect, useRef } from "react";
import {
  FolderOpen,
  Users,
  BarChart3,
  Flag,
  FileText,
  MessageCircle,
  Inbox,
  X,
  BookOpen,
  Check,
} from "lucide-react";
import { CURRENT_USER } from "./handover";
export function Avatar({ name = CURRENT_USER }) {
  return (
    <span className="avatar" aria-hidden="true">
      {name.slice(-2)}
    </span>
  );
}
export function DocIcon({ doc }) {
  const Icon =
    {
      folder: FolderOpen,
      people: Users,
      chart: BarChart3,
      flag: Flag,
      file: FileText,
      chat: MessageCircle,
    }[doc.icon] || FileText;
  return (
    <span className={`doc-icon ${doc.color}`}>
      <Icon size={23} />
    </span>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Brand() {
  return (
    <>
      <span className="brand-mark">
        <i />
        <i />
      </span>
      <span>
        업무 바통<span className="brand-dot">.</span>
      </span>
    </>
  );
}
export function Dialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal-inner">
        <button
          className="modal-close icon-button"
          aria-label="닫기"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        <span className="modal-icon">
          <BookOpen size={27} />
        </span>
        <div className="eyebrow">WORK BATON</div>
        <h2 id="modal-title">{title}</h2>
        {children}
        <button className="button primary full-width" onClick={onClose}>
          확인했어요 <Check size={16} />
        </button>
      </div>
    </dialog>
  );
}
