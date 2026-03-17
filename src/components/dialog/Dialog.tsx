import React, { type ReactNode } from 'react';
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// 1. 상태 타입 정의
type DialogContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  titleId: string;
  descriptionId: string;
};

// 2. Context 생성 (초기값은 null)
const DialogContext = createContext<DialogContextType | null>(null);

// 3. 서브 컴포넌트들이 뼈대 안에서만 놀도록 강제하는 Custom Hook
export function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog의 서브 컴포넌트들은 반드시 DialogRoot 안에서 사용되어야 합니다.');
  }
  return context;
}

// 4. 최상위 Provider (상태 소유자)
export function DialogRoot({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <DialogContext.Provider value={{ isOpen, open, close, titleId, descriptionId }}>
      {children}
    </DialogContext.Provider>
  );
}

// 5. 모달을 여는 스위치 (Trigger)
export function DialogTrigger({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  // Root가 제공하는 전역 상태에서 'open' 함수만 꺼내 쓴다.
  const { open } = useDialogContext();

  return (
    <button
      {...rest}
      aria-haspopup="dialog" // 접근성: 스크린 리더에게 "이 버튼 누르면 대화창 뜸" 알림
      onClick={(e) => {
        open(); // Context의 open 함수 실행 -> Root의 isOpen이 true로 바뀜
        onClick?.(e); // 소비자가 따로 넘긴 onClick 이벤트가 있다면 씹히지 않게 같이 실행
      }}
    >
      {children}
    </button>
  );
}

// 6. DOM 감옥 탈출구 (Portal)
export function DialogPortal({ children }: { children: React.ReactNode }) {
  const { isOpen } = useDialogContext();

  // 성능 최적화: 닫혀있을 때는 아예 DOM 노드 자체를 그리지 않는다.
  if (!isOpen) return null;

  // SSR(서버사이드) 환경 에러 방지: document가 브라우저에 존재할 때만 body를 찾음
  const target = typeof document !== 'undefined' ? document.body : null;
  if (!target) return null;

  // children을 현재 컴포넌트 위치가 아닌, target(document.body)에 강제로 그려버림
  return createPortal(children, target);
}

// 7. 클릭 시 모달 닫아주는 어두운 배경 (Overlay)
export function DialogOverlay({ children, onClick, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  // Root가 제공하는 전역 상태에서 'close' 함수만 꺼내 쓴다.
  const { close } = useDialogContext();

  return (
    <div
      {...rest}
      aria-hidden="true" // 접근성: 배경은 시각적 요소일 뿐이니 스크린 리더는 무시하라고 지시
      onClick={(e) => {
        close(); // 배경 누르면 닫힘
        onClick?.(e);
      }}
    >
      {children}
    </div>
  );
}

// 8. 모달의 본체이자 포커스 감옥 (Content)
export function DialogContent({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const { close } = useDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // 모달이 DOM에 마운트(열림)되자마자, 포커스를 모달 내부로 강제 납치한다.
  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  // 키보드 이벤트 캡처: ESC 닫기 & 포커스 트랩
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // 1. ESC 누르면 바로 닫기
    if (e.key === 'Escape') {
      e.stopPropagation(); // 부모로 이벤트 새어나가는 것 방지
      close();
      return;
    }

    // 2. Tab 키를 눌렀을 때의 '포커스 트랩' 로직
    if (e.key === 'Tab') {
      // 모달 내부에서 '포커스를 받을 수 있는' 모든 요소를 긁어모은다.
      const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab (뒤로 가기) 누를 때: 현재 포커스가 첫 번째 요소면, 마지막 요소로 강제 이동 (뺑뺑이)
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // 일반 Tab (앞으로 가기) 누를 때: 현재 포커스가 마지막 요소면, 첫 번째 요소로 강제 이동 (뺑뺑이)
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
      role="dialog" // 접근성: 스크린 리더에게 "지금부터 여긴 대화상자야"라고 선언
      aria-modal="true" // 접근성: "이 모달 뒤에 있는 요소들은 전부 투명인간(비활성) 취급해"라고 지시
      tabIndex={-1} // div는 원래 포커스를 못 받지만, 강제로 초기 포커스를 받게 만들기 위해 설정
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
// 9. 모달의 제목 (이름표)
export function DialogTitle({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
    // Context에서 공용 titleId를 꺼내온다.
    const { titleId } = useDialogContext();
  
    // h2 요소에 id를 강제로 박아준다.
    return <h2 {...rest} id={titleId}>{children}</h2>;
  }
  
  // 10. 모달의 보조 설명 (상세 설명서)
  export function DialogDescription({ children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
    // Context에서 공용 descriptionId를 꺼내온다.
    const { descriptionId } = useDialogContext();
  
    return <p {...rest} id={descriptionId}>{children}</p>;
  }
  
  // 11. 명시적인 닫기 버튼 (X 버튼 등)
  export function DialogClose({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    const { close } = useDialogContext();
  
    return (
      <button
        {...rest}
        aria-label={rest["aria-label"] ?? "모달 닫기"} // 접근성: 아이콘만 있을 경우를 대비한 기본 라벨링
        onClick={(e) => {
          close();
          onClick?.(e);
        }}
      >
        {children}
      </button>
    );
  }