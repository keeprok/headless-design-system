import React, { createContext, useContext, useState, ReactNode, useId, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

type DialogContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  titleId: string;
  descriptionId: string;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('Dialog의 서브 컴포넌트들은 반드시 DialogRoot 안에서 사용되어야 합니다.');
  return context;
}

export function DialogRoot({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <DialogContext.Provider value={{ isOpen, open, close, titleId, descriptionId }}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open } = useDialogContext();
  return (
    <button
      {...rest}
      aria-haspopup="dialog"
      onClick={(e) => {
        open();
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  const { isOpen } = useDialogContext();
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null; // Early Return 적용
  return createPortal(children, document.body);
}

export function DialogOverlay({ children, onClick, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const { close } = useDialogContext();
  return (
    <div
      {...rest}
      aria-hidden="true"
      onClick={(e) => {
        close();
        onClick?.(e);
      }}
    >
      {children}
    </div>
  );
}

// ==========================================================
// [3차 뼈대] DialogContent : 모달 본체 & 포커스 감옥
// ==========================================================
export function DialogContent({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  // Root에서 만든 id 2개와 close 함수를 가져온다.
  const { close, titleId, descriptionId } = useDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // 1. 초기 포커스 납치: 모달이 뜨자마자 모달 컨테이너로 포커스를 강제 이동
  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  // 2. 키보드 이벤트 캡처 (ESC 닫기 & 포커스 트랩)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // ESC 키 방어
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }

    // Tab 키 방어 (포커스 트랩)
    if (e.key === 'Tab') {
      const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab (뒤로 가기)
      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === contentRef.current) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // 일반 Tab (앞으로 가기)
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return (
    <div
      {...rest}
      ref={contentRef}
      role="dialog"
      aria-modal="true" // 모달 밖은 투명인간 취급하라는 스크린 리더용 지시어
      aria-labelledby={titleId} // 4차 뼈대의 Title과 자동 연결
      aria-describedby={descriptionId} // 4차 뼈대의 Description과 자동 연결
      tabIndex={-1} // div가 초기 포커스를 받을 수 있도록 허용
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}

// ==========================================================
// [4차 뼈대] Title, Description, Close : 접근성 마침표
// ==========================================================
export function DialogTitle({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialogContext();
  return (
    <h2 {...rest} id={titleId}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialogContext();
  return (
    <p {...rest} id={descriptionId}>
      {children}
    </p>
  );
}

export function DialogClose({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { close } = useDialogContext();
  return (
    <button
      {...rest}
      aria-label={rest['aria-label'] ?? '모달 닫기'}
      onClick={(e) => {
        close();
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
