import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ============================================================
// Context
//
// Context API를 사용하는 이유:
//   Compound Component 패턴에서 <Dialog>의 열림/닫힘 상태와 id를
//   <DialogTrigger>, <DialogOverlay>, <DialogContent> 등 하위 컴포넌트들이
//   각각 prop drilling 없이 공유해야 한다.
//   Context는 이 "관심사의 범위(scope)"를 명확히 경계 짓고,
//   소비자가 내부 구현이 아닌 공개 인터페이스(<Dialog>, <DialogTrigger> 등)
//   만 알면 되도록 캡슐화한다.
//
// Compound Component 패턴의 장점:
//   - 소비자가 UI 구조(레이아웃, 중첩 순서)를 직접 결정할 수 있다.
//     e.g. Overlay 없이 Content만 쓰거나, Trigger를 여러 개 배치할 수 있다.
//   - 각 서브컴포넌트가 단일 책임을 가져 테스트·교체가 쉽다.
//   - Radix UI, Headless UI, Reach UI 등 주요 헤드리스 라이브러리가
//     동일한 패턴을 사용하는 업계 표준이다.
// ============================================================

type DialogContextValue = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  // aria-labelledby / aria-describedby 연결을 위한 id들
  titleId: string;
  descriptionId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

// 서브컴포넌트에서 Context를 사용할 때 반드시 <Dialog> 하위인지 검증한다.
// 잘못된 사용을 런타임에 조기에 감지해 디버깅 비용을 줄인다.
function useDialogContext(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error(
      "[Dialog] 서브컴포넌트는 반드시 <Dialog> 안에서 사용해야 합니다."
    );
  }
  return ctx;
}

// ============================================================
// Props 타입
// ============================================================

export type DialogProps = {
  children: React.ReactNode;
  /**
   * 열림 상태를 외부에서 제어(Controlled).
   * open + onOpenChange를 함께 전달하면 완전한 controlled 모드가 된다.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Uncontrolled 모드의 초기 열림 상태 */
  defaultOpen?: boolean;
};

export type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export type DialogPortalProps = {
  children: React.ReactNode;
  /**
   * Portal이 마운트될 DOM 컨테이너.
   * 지정하지 않으면 document.body를 사용한다.
   * SSR 환경에서 null이 들어올 수 있으므로 null도 허용한다.
   */
  container?: HTMLElement | null;
};

export type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement>;

export type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * 외부에서 전달한 포커스 가능 요소 ref.
   * 미제공 시 DialogContent 자체에 포커스를 준다.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
};

export type DialogTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
export type DialogDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;
export type DialogCloseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

// ============================================================
// <Dialog> — 루트 컴포넌트 / 상태 소유자
// ============================================================

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DialogProps) {
  // Controlled/Uncontrolled 패턴:
  // open prop이 있으면 외부 상태를 쓰고, 없으면 내부 상태를 쓴다.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const titleId = useId();
  const descriptionId = useId();

  const onOpen = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(true);
    onOpenChange?.(true);
  }, [isControlled, onOpenChange]);

  const onClose = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(false);
    onOpenChange?.(false);
  }, [isControlled, onOpenChange]);

  return (
    <DialogContext.Provider
      value={{ open, onOpen, onClose, titleId, descriptionId }}
    >
      {children}
    </DialogContext.Provider>
  );
}

// ============================================================
// <DialogTrigger> — 모달을 여는 트리거 버튼
// ============================================================

export function DialogTrigger({ onClick, ...rest }: DialogTriggerProps) {
  const { onOpen, open } = useDialogContext();

  return (
    <button
      {...rest}
      // aria-haspopup: 이 버튼이 dialog를 열 것임을 스크린 리더에 미리 알린다.
      aria-haspopup="dialog"
      // aria-expanded: 현재 dialog의 열림 상태를 버튼에 반영한다.
      aria-expanded={open}
      onClick={(e) => {
        onOpen();
        onClick?.(e);
      }}
    />
  );
}

// ============================================================
// <DialogPortal> — createPortal로 document.body에 렌더링
//
// Portal을 사용하는 이유:
//   부모 요소에 overflow:hidden, transform, z-index 등이 있으면
//   모달이 의도치 않게 잘리거나 쌓임 맥락(stacking context)에 갇힐 수 있다.
//   document.body 하단에 렌더하면 이 모든 CSS 충돌에서 자유로워진다.
// ============================================================

export function DialogPortal({ children, container }: DialogPortalProps) {
  const { open } = useDialogContext();

  // open이 false이면 Portal 자체를 마운트하지 않는다.
  // 불필요한 DOM 노드와 포커스 관리 비용을 줄이기 위함이다.
  if (!open) return null;

  const target =
    container ?? (typeof document !== "undefined" ? document.body : null);

  if (!target) return null;

  return createPortal(children, target);
}

// ============================================================
// <DialogOverlay> — 배경 딤 레이어 / 클릭 시 닫힘
// ============================================================

export function DialogOverlay({ onClick, ...rest }: DialogOverlayProps) {
  const { onClose } = useDialogContext();

  return (
    <div
      {...rest}
      // aria-hidden: Overlay는 순수 시각적 요소이므로 스크린 리더 트리에서 제외한다.
      aria-hidden="true"
      onClick={(e) => {
        onClose();
        onClick?.(e);
      }}
    />
  );
}

// ============================================================
// <DialogContent> — 실제 모달 콘텐츠 컨테이너
// ============================================================

export function DialogContent({
  children,
  initialFocusRef,
  onKeyDown,
  ...rest
}: DialogContentProps) {
  const { onClose, titleId, descriptionId } = useDialogContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // ── 포커스 트랩(Focus Trap) ──────────────────────────────────
  // 모달이 열렸을 때 포커스를 모달 안으로 이동한다.
  // WCAG 2.1 SC 2.1.2: 모달 내부에서 포커스가 탈출하지 않아야 한다.
  useEffect(() => {
    const target = initialFocusRef?.current ?? contentRef.current;
    target?.focus();
  }, [initialFocusRef]);

  // ── 포커스 탈출 방지 ──────────────────────────────────────────
  // Tab / Shift+Tab 이 모달 안의 focusable 요소들 사이를 순환하게 만든다.
  const handleFocusTrap = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;

      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  // ── ESC 키로 닫기 ─────────────────────────────────────────────
  // document 레벨이 아닌 Content의 keydown에서 처리해
  // 이 Dialog 인스턴스에만 적용되도록 한다.
  // (중첩 Dialog가 있을 때 바깥 Dialog까지 닫히는 문제를 방지)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ── body 스크롤 잠금 ─────────────────────────────────────────
  // 모달이 열린 동안 배경 페이지가 스크롤되지 않도록 한다.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      {...rest}
      ref={contentRef}
      // role="dialog": 이 요소가 대화 상자임을 스크린 리더에 알린다.
      role="dialog"
      // aria-modal="true": 모달 외부 콘텐츠가 비활성(inert)임을 선언한다.
      // 일부 스크린 리더는 이 값을 보고 자동으로 포커스를 모달 안에 가둔다.
      aria-modal="true"
      // aria-labelledby: <DialogTitle>의 id와 연결해 모달의 제목을 스크린 리더에 알린다.
      // 스크린 리더는 모달이 열릴 때 이 제목을 자동으로 읽는다.
      aria-labelledby={titleId}
      // aria-describedby: <DialogDescription>의 id와 연결해 보조 설명을 제공한다.
      aria-describedby={descriptionId}
      // tabIndex=-1: 포커스 트랩 첫 진입 시 ref.focus()가 동작하려면 필요하다.
      tabIndex={-1}
      onKeyDown={(e) => {
        handleFocusTrap(e);
        onKeyDown?.(e);
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// <DialogTitle> — 모달 제목 (aria-labelledby 타깃)
// ============================================================

export function DialogTitle({ ...rest }: DialogTitleProps) {
  const { titleId } = useDialogContext();

  // DialogContent의 aria-labelledby와 자동 연결된다.
  // 소비자가 id를 직접 관리하지 않아도 된다.
  return <h2 {...rest} id={titleId} />;
}

// ============================================================
// <DialogDescription> — 보조 설명 (aria-describedby 타깃)
// ============================================================

export function DialogDescription({ ...rest }: DialogDescriptionProps) {
  const { descriptionId } = useDialogContext();

  return <p {...rest} id={descriptionId} />;
}

// ============================================================
// <DialogClose> — 모달을 닫는 버튼
// ============================================================

export function DialogClose({ onClick, ...rest }: DialogCloseProps) {
  const { onClose } = useDialogContext();

  return (
    <button
      {...rest}
      // aria-label이 없을 때 스크린 리더를 위한 기본값
      aria-label={rest["aria-label"] ?? "닫기"}
      onClick={(e) => {
        onClose();
        onClick?.(e);
      }}
    />
  );
}
