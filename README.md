# Soboon Headless Design System

**특정 비즈니스 도메인·디자인 시스템에 종속되지 않는 범용(Domain-Agnostic) Headless UI 컴포넌트 라이브러리**

> 이전 팀 프로젝트에서 겪은 **디자인-로직 강결합** 문제를 해결하기 위해 설계했습니다.  
> "디자인 껍데기"와 "동작 로직"을 분리하는 Headless 아키텍처와 WAI-ARIA 국제 접근성 표준 준수를 핵심 목표로 삼았습니다.

---

## 📌 Stack

| 분류 | 기술 |
|------|------|
| 런타임 | React 18, TypeScript 5.5 |
| 빌드 | Vite 7 |
| 문서화·개발 환경 | Storybook 10 (+ a11y addon) |
| 테스트 | Vitest 4 + Playwright (Chromium) |
| CI/CD | GitHub Actions → GitHub Pages |
| 코드 품질 | ESLint + eslint-plugin-jsx-a11y + eslint-plugin-react-hooks |

---

## 🏗️ 아키텍처 핵심 원칙

### 1. Headless 설계 — 동작과 스타일의 완전한 분리

컴포넌트는 **동작(Behavior), 상태(State), 접근성(Accessibility)** 만 책임지고, 시각적 표현은 소비자(Consumer)에게 완전히 위임합니다.

```tsx
// ❌ 스타일이 내부에 고정된 일반 컴포넌트
<Button className="btn btn-primary rounded-md px-4 py-2">확인</Button>

// ✅ 헤드리스 컴포넌트 — 스타일은 소비자가 data-* 속성으로 제어
<Button data-disabled data-loading>확인</Button>
```

소비자가 CSS 선택자로 상태 기반 스타일을 입힐 수 있도록 `data-disabled`, `data-loading` 같은 **data 속성을 공개 계약(Contract)으로 명시적으로 노출**합니다.

---

### 2. Compound Component 패턴 — 조합 가능한 API

Dialog·Select 같은 복합 UI를 단일 컴포넌트로 만들면 prop이 폭증하고, 소비자가 내부 상태(`isOpen`, `focusedIndex`)와 prop 이름을 모두 외워야 합니다.  
소비자가 **마크업 단위로 직접 조립하면서도 상태는 의식하지 않도록** API를 재설계했습니다.

```tsx
// Compound Component 패턴: 소비자가 구조를 직접 결정
<DialogRoot>
  <DialogTrigger>모달 열기</DialogTrigger>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명</DialogDescription>
      <DialogClose>닫기</DialogClose>
    </DialogContent>
  </DialogPortal>
</DialogRoot>
```

- **Root / Trigger / Content 단위로 분해** — 소비자가 마크업으로 조립
- **Context API로 isOpen, focusedIndex 등 내부 상태를 은닉**, prop drilling 제거
- 사용 시 내부 구조 학습 불필요, 디자인 변경 시 마크업 손대지 않고 스타일만 교체 가능

---

### 3. WAI-ARIA 표준 기반 접근성 설계

기존에 만들었던 모달과 셀렉트는 마우스를 가정한 구현이라, 키보드 사용자가 모달을 닫지 못하거나 스크린 리더가 열린 상태를 인식하지 못하는 문제가 있었습니다. 국제 접근성 표준(WAI-ARIA)을 기준으로 재설계했습니다.

- **Dialog**: `createPortal`로 DOM 분리 + `useRef` 기반 Focus Trap으로 모달 내부 포커스 이탈 방지
- **Select**: `role="listbox"`, `aria-expanded` 속성을 상태와 동기화해 스크린 리더 호환
- **방향키(↑/↓) 기반 Roving tabindex** 네비게이션 적용, Tab 키로 옵션을 일일이 순회하지 않도록 개선

> 마우스 없이도 모든 인터랙션 완결, WAI-ARIA 권고안 패턴 준수

---

## 🧩 컴포넌트별 기술 상세

### Button

**핵심 고민: 다형성(Polymorphism)과 Slot 패턴**

시맨틱하게는 `<a>` 태그여야 하지만 Button의 로딩/비활성 처리가 필요한 경우가 생겼습니다. 컴포넌트 타입을 교체할 수 있는 두 가지 방법을 모두 구현했습니다.

```tsx
// as prop: 렌더링 태그 교체
<Button as="a" href="/home">홈으로</Button>

// asChild (Slot 패턴): 자식 엘리먼트에 모든 props 위임 (Radix UI 동일 개념)
<Button asChild>
  <a href="/home">홈으로</a>
</Button>
```

| 결정 | 이유 |
|------|------|
| `aria-disabled` vs native `disabled` | `disabled`는 포커스를 완전히 제거 → 키보드 사용자가 로딩 완료를 기다릴 수 없음. `aria-disabled`는 포커스를 유지하면서 클릭만 차단 |
| `aria-busy` | 스크린 리더에 "현재 처리 중"임을 알리는 ARIA 1.1 속성 |
| `type="button"` 기본값 | form 안에 있을 때 의도치 않은 submit 방지 |
| 완전 무상태(Stateless) | 상태를 소비자에게 위임해 폼 라이브러리(react-hook-form, Formik)와 충돌 없이 통합 |

**TypeScript 챌린지**: `React.forwardRef`는 단일 타입 파라미터 쌍만 지원해 제네릭 렌더 함수를 그대로 넘기면 `as` prop의 타입 파라미터 `C`가 소실됩니다. `as` 타입 단언으로 원래 제네릭 시그니처를 복원하는 패턴을 Radix UI·MUI 등 주요 라이브러리와 동일하게 적용했습니다.

---

### Input

**핵심 고민: 상태 소유권과 이벤트 추상화**

```tsx
// 네이티브 onChange 대신 value(string)만 전달하는 커스텀 onChange
<Input
  label="이메일"
  invalid={!!errors.email}
  description={errors.email?.message}
  onChange={(value) => setValue('email', value)}
/>
```

| 결정 | 이유 |
|------|------|
| `onChange: (value: string) => void` | 이벤트 객체 구조에 의존하지 않아도 되고, React 외 환경(RN, Preact)으로 포팅 시 인터페이스 유지 |
| 완전 무상태 설계 | 값을 내부에서 관리하면 폼 라이브러리와 충돌. 상태 소유권을 소비자에게 넘겨 단일 진실 공급원(Single Source of Truth) 확보 |
| `useId()` (React 18) | 서버/클라이언트 양쪽에서 동일한 id 생성 → 하이드레이션 불일치 방지. `label htmlFor` 연결에 항상 고유 id 보장 |
| `aria-describedby` 자동 구성 | 내부 `description`과 외부 `describedById` 모두 지원, 둘 다 있으면 공백으로 병합 (ARIA 명세: 공백 구분 id 목록 허용) |

---

### Dialog

**핵심 고민: Portal, Focus Trap, 중첩 모달 대응**

```
DialogRoot (Context Provider, isOpen 상태 소유)
├── DialogTrigger  (aria-haspopup="dialog")
└── DialogPortal   (createPortal → document.body)
    ├── DialogOverlay  (클릭 시 close, aria-hidden="true")
    └── DialogContent  (role="dialog", aria-modal="true", Focus Trap)
        ├── DialogTitle       (aria-labelledby 타깃)
        ├── DialogDescription (aria-describedby 타깃)
        └── DialogClose
```

**Portal을 사용하는 이유**  
부모 요소에 `overflow:hidden`, `transform`, `z-index` 등이 있으면 모달이 잘리거나 stacking context에 갇힙니다. `document.body` 하단에 렌더하면 이 모든 CSS 충돌에서 자유로워집니다.

**Focus Trap 구현**

```tsx
// Tab 키 방어: 모달 안의 focusable 요소들 사이를 순환
const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const first = focusableElements[0];
const last  = focusableElements[focusableElements.length - 1];

if (e.shiftKey && document.activeElement === first) {
  e.preventDefault(); last.focus();   // 첫 요소에서 Shift+Tab → 마지막으로 순환
} else if (!e.shiftKey && document.activeElement === last) {
  e.preventDefault(); first.focus();  // 마지막에서 Tab → 첫 요소로 순환
}
```

| 기술 결정 | 이유 |
|-----------|------|
| `role="dialog"` + `aria-modal="true"` | 스크린 리더가 모달 외부를 비활성으로 인식 |
| `aria-labelledby`, `aria-describedby` | 모달 오픈 시 스크린 리더가 제목·설명을 자동으로 읽음 |
| `tabIndex={-1}` on content div | JS로 초기 포커스를 줄 수 있도록 허용 |
| ESC 키 `stopPropagation()` | 중첩 모달 환경에서 바깥 모달까지 닫히는 버그 방지 |
| `createPortal` | CSS stacking context 충돌 완전 차단 |

**Reference 구현** (`Dialog_Reference.tsx`): Controlled/Uncontrolled 모드, body scroll lock, `initialFocusRef`, document-level ESC 리스너가 추가된 프로덕션 수준의 확장 버전을 별도 보존.

---

### Select

**핵심 고민: Controlled/Uncontrolled 패턴과 Listbox 키보드 네비게이션**

```
SelectRoot (isOpen + value 상태 소유, Controlled/Uncontrolled 분기)
├── SelectTrigger  (aria-haspopup="listbox", aria-expanded)
└── SelectPortal   (createPortal)
    ├── SelectOverlay  (외부 클릭 감지, aria-hidden)
    └── SelectContent  (role="listbox", 방향키 네비게이션)
        └── SelectOption × N  (role="option", aria-selected, Enter/Space 선택)
```

**Controlled/Uncontrolled 동시 지원**

```tsx
// Uncontrolled — 내부 상태로 동작
<SelectRoot defaultValue="kr">...</SelectRoot>

// Controlled — 폼 라이브러리와 통합
<SelectRoot value={field.value} onChange={field.onChange}>...</SelectRoot>
```

**WAI-ARIA Listbox 키보드 네비게이션 (Roving tabindex)**

```tsx
// ArrowDown/ArrowUp: DOM에서 [role="option"] 요소를 수집해 포커스 이동
const options = contentRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
const currentIndex = options.indexOf(document.activeElement as HTMLElement);

// 끝에 도달하면 처음으로 순환 (wrap-around)
const nextIndex = e.key === 'ArrowDown'
  ? (currentIndex + 1) % options.length
  : (currentIndex - 1 + options.length) % options.length;

options[nextIndex]?.focus();
```

| 기술 결정 | 이유 |
|-----------|------|
| `role="listbox"` + `role="option"` | 네이티브 `<select>`가 아닌 커스텀 드롭다운에서 스크린 리더 호환성 확보 |
| `aria-selected` 실시간 동기화 | 현재 선택 상태를 스크린 리더에 즉시 반영 |
| `e.preventDefault()` on ArrowKey | 방향키 입력 시 화면 스크롤 현상 차단 |
| `useMemo` on contextValue | `SelectRoot` 리렌더 시 새 객체 생성으로 인한 하위 전체 리렌더링 방지 |
| Context 분리 예정 (State / Dispatch) | 현재 단일 Context로 `isOpen`이 바뀔 때 toggle만 쓰는 `SelectTrigger`도 리렌더됨 → `SelectStateContext` / `SelectDispatchContext` 2개로 분리하면 구독 최소화 가능 |

---

## 🔬 기술적 도전과 성과

### 1. `forwardRef` + 다형성 제네릭 타입 복원

`React.forwardRef`는 제네릭 함수를 지원하지 않아 `as` prop의 타입 파라미터가 소실되는 문제가 있습니다. Radix UI·MUI가 사용하는 `as` 단언 패턴으로 외부 시그니처의 제네릭 정확도를 복원했습니다.

```tsx
export const Button = forwardRef(ButtonRender) as <
  C extends React.ElementType = "button"
>(props: ButtonProps<C>) => React.ReactElement | null;
```

### 2. Storybook play 함수 기반 브라우저 통합 테스트

별도 테스트 파일 없이 Storybook `play` 함수와 Vitest + Playwright Chromium으로 실제 브라우저에서 인터랙션·접근성을 검증합니다.

```tsx
// 키보드 네비게이션이 실제 Chromium에서 동작하는지 검증
play: async ({ canvasElement }) => {
  await userEvent.keyboard('{ArrowDown}');
  await expect(options[1]).toHaveFocus();

  await userEvent.keyboard('{Escape}');
  await expect(listbox).not.toBeVisible();
}
```

### 3. a11y 위반 시 CI 빌드 실패

`.storybook/preview.tsx`에서 `a11y.test: 'error'`를 설정해 접근성 위반이 발견되면 CI가 실패하도록 구성. ARIA 속성 누락·역할 충돌을 자동으로 감지합니다.

### 4. Context 값 메모이제이션으로 불필요한 리렌더 방지

```tsx
const contextValue = useMemo(() => ({
  isOpen, open, close, toggle, value, onChange
}), [isOpen, currentValue]);
// isOpen 또는 currentValue가 바뀔 때만 새 객체 생성
// 인라인 객체 사용 시 발생하는 전체 하위 리렌더링 문제 해소
```

---

## 🧪 테스트 전략

모든 테스트는 Storybook `play` 함수로 작성되며, Vitest + Playwright Chromium으로 **실제 브라우저 환경**에서 실행됩니다.

| 컴포넌트 | 검증 항목 |
|---------|---------|
| Button | `aria-busy`, `aria-disabled` 상태 동기화 |
| Input | `getByLabelText` 연결, `aria-invalid` 상태 |
| Select | 클릭 열기/닫기, 방향키 네비게이션, Escape 닫기 |
| Dialog | Portal 렌더링, `aria-modal`, Escape 닫기, Close 버튼 |

---

## 🔄 CI/CD 파이프라인

```
push / PR to main
      │
      ▼
  [ci job]
  1. ESLint (jsx-a11y, react-hooks)
  2. TypeScript strict 타입 체크
  3. Storybook play 함수 → Vitest + Playwright Chromium
  4. Vite 프로덕션 빌드
      │
      ▼ (push only)
  [deploy job]
  GitHub Pages 배포
```

---

## 📁 프로젝트 구조

```
src/components/
├── button/
│   └── Button.tsx       # 다형성 + asChild(Slot) + aria-disabled/busy
├── input/
│   └── Input.tsx        # 무상태, value onChange 추상화, aria-describedby 자동 구성
├── dialog/
│   ├── Dialog.tsx           # 활성 구현 (Focus Trap, Portal, Compound)
│   └── Dialog_Reference.tsx # 확장 참고 구현 (Controlled, scroll lock)
└── select/
    └── select.tsx       # Listbox 키보드 네비게이션, Controlled/Uncontrolled
```
