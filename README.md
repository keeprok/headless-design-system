# Headless Design System

특정 디자인 시스템에 종속되지 않는 범용 Headless UI 컴포넌트 라이브러리.  
이전 팀 프로젝트에서 디자인-로직 강결합으로 재사용이 불가능했던 경험을 계기로, 동작 로직과 스타일을 완전히 분리하는 구조를 직접 설계했습니다.

**Stack** — React 18, TypeScript 5.5, Vite 7, Storybook 10, Vitest + Playwright, GitHub Actions

---

## 핵심 설계 결정

### 1. Headless — 동작만 책임지고 스타일은 소비자에게 위임
컴포넌트는 상태·접근성 속성·data 훅만 노출합니다. `data-disabled`, `data-loading` 같은 data 속성을 공개 계약(Contract)으로 명시해 소비자가 CSS 선택자로 스타일을 입힐 수 있도록 했습니다.

### 2. Compound Component — 조합 가능한 API 설계
Dialog·Select를 단일 컴포넌트로 만들면 prop이 폭증하고 내부 구조를 강제합니다. Root / Trigger / Content 단위로 분해해 소비자가 마크업을 직접 조립하도록 했고, 내부 상태(`isOpen`, `value`)는 Context API로 은닉해 prop drilling을 제거했습니다.

### 3. WAI-ARIA — 키보드만으로 모든 인터랙션 완결
마우스를 가정한 구현에서 스크린 리더·키보드 사용자가 소외되는 문제를 직접 경험한 뒤 WAI-ARIA 권고안을 기준으로 재설계했습니다.

---

## 컴포넌트별 핵심 고민

| 컴포넌트 | 핵심 결정 | 이유 |
|---------|----------|------|
| **Button** | `aria-disabled` + `onClick` 차단 (native `disabled` 미사용) | `disabled`는 포커스를 제거 → 키보드 사용자가 로딩 완료를 기다릴 수 없음 |
| **Button** | `asChild` Slot 패턴 | `as` prop과 달리 자식의 실제 컴포넌트 구조를 완전히 유지하면서 props 위임 가능 |
| **Input** | 완전 무상태, `onChange: (value: string)` | 폼 라이브러리(react-hook-form)와 충돌 없이 통합. 이벤트 객체 의존성 제거 |
| **Input** | `useId()` 기반 자동 ID 생성 | SSR 하이드레이션 불일치 방지, `label`-`input` 연결 항상 보장 |
| **Dialog** | `createPortal` → `document.body` 렌더 | 부모 `overflow:hidden` · `transform`으로 인한 stacking context 충돌 차단 |
| **Dialog** | Tab/Shift+Tab Focus Trap | WCAG 2.1 SC 2.1.2 — 모달 내부에서 포커스가 탈출하지 않아야 함 |
| **Dialog** | ESC 키에 `stopPropagation()` | 중첩 모달 환경에서 바깥 모달까지 닫히는 버그 방지 |
| **Select** | Roving tabindex (방향키 ↑↓ 네비게이션) | `role="listbox"` WAI-ARIA 표준 — Tab으로 옵션을 일일이 순회하지 않도록 |
| **Select** | Controlled / Uncontrolled 동시 지원 | `value` 전달 시 폼 라이브러리가 제어, 미전달 시 내부 상태로 동작 |
| **Select** | `useMemo` on Context value | 인라인 객체 사용 시 `SelectRoot` 리렌더마다 전체 하위 리렌더링 발생 → 방어 |

---

## 기술적 챌린지

- **`forwardRef` + 제네릭 타입 복원** — `React.forwardRef`는 제네릭 함수 미지원. `as` 단언으로 외부 시그니처의 다형성 타입을 복원 (Radix UI·MUI 동일 패턴)
- **Storybook `play` 함수로 브라우저 통합 테스트** — 별도 테스트 파일 없이 Vitest + Playwright Chromium에서 실제 인터랙션·접근성 검증
- **a11y 위반 시 CI 빌드 실패** — `a11y.test: 'error'` 설정으로 ARIA 속성 누락·역할 충돌을 자동 감지
- **Context 분리 예정** — 현재 단일 Context로 `isOpen` 변경 시 불필요한 하위 리렌더 발생 → State / Dispatch Context 분리로 구독 최소화 계획

---

## CI/CD

`push / PR → main` 시 ESLint(jsx-a11y) → TypeScript strict → Storybook play 테스트 → 빌드 순으로 실행.  
빌드 통과 시 GitHub Pages에 자동 배포.
