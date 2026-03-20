import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
// 1. Select 상태 타입 정의
type SelectContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void; // Select는 버튼 하나로 열고 닫는 경우가 많아 toggle이 필수다.

  // Dialog에 없던 핵심 상태: '현재 선택된 값'과 '값을 변경하는 함수'
  value?: string;
  onChange: (value: string) => void;
};

// 2. Context 생성
const SelectContext = createContext<SelectContextType | null>(null);

// 3. 서브 컴포넌트 강제 훅
export function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select의 서브 컴포넌트들은 반드시 SelectRoot 안에서 사용되어야 합니다.');
  }
  return context;
}

// 4. Root Props 타입 정의 (양방향 통신의 핵심)
type SelectRootProps = {
  children: ReactNode;

  /** * [양방향 통신 1] 부모(Form)가 주입하는 현재 값 (Controlled 모드)
   * react-hook-form 같은 라이브러리가 이 value를 쥐고 흔든다.
   */
  value?: string;

  /** * [양방향 통신 2] 유저가 Option을 클릭했을 때 부모에게 "이걸로 바뀌었어요!"라고 알리는 무전기.
   * 이 콜백이 있어야 부모의 state가 업데이트된다.
   */
  onChange?: (value: string) => void;

  /** 외부 상태 없이 내부적으로 굴러갈 때(Uncontrolled) 쓸 초기값 */
  defaultValue?: string;
};

// 5. 최상위 Provider (상태 소유자 및 통신병)
export function SelectRoot({ children, value: controlledValue, onChange, defaultValue }: SelectRootProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  // 외부에서 value를 주입했으면(Controlled) 그걸 쓰고, 아니면 내부 상태(Uncontrolled)를 쓴다.
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;

  // 자식(<Option>)이 이 함수를 호출하면, 값을 업데이트하고 드롭다운을 닫아준다.
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onChange?.(newValue); // 부모(Form)에게 보고!
    setIsOpen(false); // 값 선택했으니 깔끔하게 모달 닫기
  };

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen((prev) => !prev),
        value: currentValue,
        onChange: handleValueChange, // 자식들에게 무전기(onChange)를 쥐어준다.
      }}
    >
      {children}
    </SelectContext.Provider>
  );
}

// ==========================================================
// [2차 뼈대] SelectTrigger : 드롭다운을 열고 닫는 스위치
// ==========================================================
export function SelectTrigger({ children, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { isOpen, toggle, value } = useSelectContext();

  return (
    <button
      {...rest}
      aria-haspopup="listbox" // 접근성: "이 버튼을 누르면 리스트 박스가 열립니다"
      aria-expanded={isOpen} // 접근성: 스크린 리더에게 현재 열려있는지 닫혀있는지 상태 실시간 보고
      onClick={(e) => {
        toggle(); // Select는 클릭할 때마다 열림/닫힘이 토글되어야 한다.
        onClick?.(e);
      }}
    >
      {/* 핵심: 유저가 선택한 value가 있으면 그걸 보여주고, 없으면 부모가 넘긴 기본값(placeholder)을 보여준다 */}
      {value ? value : children}
    </button>
  );
}

// ==========================================================
// [2차 뼈대] SelectPortal : DOM 감옥 탈출구 (Dialog와 100% 동일)
// ==========================================================
export function SelectPortal({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSelectContext();

  // 닫혀있으면 DOM 자체를 그리지 않음 (성능 최적화)
  if (!isOpen) return null;
  // SSR 환경 에러 방어 (Early Return)
  if (typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}

// ==========================================================
// [2차 뼈대] SelectOverlay : 외부 클릭 감지용 투명 방어막
// ==========================================================
export function SelectOverlay({ children, onClick, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const { close } = useSelectContext();

  return (
    <div
      {...rest}
      aria-hidden="true"
      onClick={(e) => {
        close(); // 투명한 배경을 클릭하는 순간 Select가 닫힘
        onClick?.(e);
      }}
    >
      {children}
    </div>
  );
}

// ==========================================================
// [3차 뼈대] SelectContent : 옵션들을 담는 껍데기 & 키보드 네비게이션 관제탑
// ==========================================================
export function SelectContent({ children, ...rest }: React.HTMLAttributes<HTMLUListElement>) {
  const { isOpen, close } = useSelectContext();
  const contentRef = useRef<HTMLUListElement>(null);

  // 1. 초기 포커스: 드롭다운이 열리면 리스트박스 자체로 포커스를 옮긴다.
  useEffect(() => {
    if (isOpen) {
      contentRef.current?.focus();
    }
  }, [isOpen]);

  // 2. 키보드 네비게이션 (WAI-ARIA Listbox 표준 접근성)
  // 마우스 없이 방향키(위/아래)만으로 옵션을 탐색할 수 있게 만드는 핵심 로직.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    // ESC: 즉시 닫기
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }

    // 위/아래 방향키: 옵션 간 포커스 이동 (Roving tabindex 패턴의 기초)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // 방향키 누를 때 화면 전체가 스크롤되는 현상 방지

      // 현재 Content 안의 모든 Option(역할이 option인 요소)을 긁어모은다.
      const options = Array.from(contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]') || []);
      if (options.length === 0) return;

      const currentIndex = options.indexOf(document.activeElement as HTMLElement);

      let nextIndex = 0;
      if (e.key === 'ArrowDown') {
        // 아래로: 끝에 도달하면 다시 맨 위로 (뺑뺑이)
        nextIndex = currentIndex + 1 >= options.length ? 0 : currentIndex + 1;
      } else if (e.key === 'ArrowUp') {
        // 위로: 맨 위에서 누르면 맨 아래로 (뺑뺑이)
        nextIndex = currentIndex - 1 < 0 ? options.length - 1 : currentIndex - 1;
      }

      options[nextIndex]?.focus();
    }
  };

  return (
    <ul
      {...rest}
      ref={contentRef}
      role="listbox" // 접근성: "이 ul 태그는 단순한 목록이 아니라 '선택 가능한 리스트박스'다"
      tabIndex={-1} // 스크립트로 포커스를 주기 위해 -1 설정
      onKeyDown={handleKeyDown}
    >
      {children}
    </ul>
  );
}

// ==========================================================
// [4차 뼈대] SelectOption : 개별 선택지 & 무전기 송신소
// ==========================================================
type SelectOptionProps = React.HTMLAttributes<HTMLLIElement> & {
  value: string; // 이 옵션이 가진 고유한 값
};

export function SelectOption({ value, children, ...rest }: SelectOptionProps) {
  // Root에서 '현재 선택된 값(selectedValue)'과 '무전기(onChange)'를 꺼내온다.
  const { value: selectedValue, onChange } = useSelectContext();

  // 현재 이 옵션이 선택된 상태인지 확인
  const isSelected = value === selectedValue;

  return (
    <li
      {...rest}
      role="option" // 접근성: "나는 listbox 안의 선택지(option)다"
      aria-selected={isSelected} // 접근성: 스크린 리더에게 이 옵션이 현재 선택되었는지(true/false) 실시간 보고
      tabIndex={0} // 키보드 방향키로 포커스를 받을 수 있도록 0으로 설정
      // [핵심 1] 마우스 클릭 시: 무전기(onChange)로 내 value를 Root에 쏜다.
      onClick={(e) => {
        onChange(value);
        rest.onClick?.(e);
      }}
      // [핵심 2] 키보드 선택 시: 방향키로 이동하다가 Enter나 Space를 누르면 선택 처리!
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onChange(value); // 마우스 클릭과 완벽하게 동일한 무전기 송신
        }
        rest.onKeyDown?.(e);
      }}
    >
      {children}
    </li>
  );
}
