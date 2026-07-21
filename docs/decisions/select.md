# Headless Design System — Decision Log

## "AI 도구로 빠르게 구현하되, 모든 설계 결정을 스스로 검증하고 문서화했습니다. 각 항목은 '왜 이 선택을 했는가'와 '무엇을 포기했는가(트레이드오프)'를 담습니다.

## Select

### Controlled vs Uncontrolled

**문제:** 컴포넌트는 부모가 값을 직접 제어(controlled)하는 경우와, 내부에서 관리(uncontrolled)하는 경우를 모두 지원해야 한다. 이걸 truthy 체크(`!value`)로 판별하면, 부모가 일부러 빈 문자열(`""`)을 넘긴 경우에도 "값 없음 = uncontrolled"로 오판한다.

**선택:** `controlledValue !== undefined`로 판별한다. `undefined`는 "value prop이 아예 생략됨"을 뜻하는 유일한 신호이므로, `""`·`null` 같은 유효한 값은 정상적인 controlled 값으로 인정된다.

**트레이드오프:** 판별을 맞게 해도, 상태를 바꾸는 함수(`handleValueChange` 등)마다 `if (!isControlled)`로 감싸 내부 state 갱신을 막아야 한다. source of truth를 부모 하나로 유지하기 위한 것인데, 앞으로 상태 변경 함수를 추가할 때 이 가드를 빼먹으면 desync가 재발할 수 있다.

---

### Context 분리

**문제:** 하나의 Context에 상태(`isOpen`, `value`)와 함수(`open`, `close`, `toggle`, `onChange`)가 섞여 있으면, `isOpen`이나 `value`가 바뀔 때마다 함수만 사용하는 컴포넌트(예: `SelectTrigger`)까지 불필요하게 리렌더된다.

**선택:** 두 가지를 함께 적용한다. ① Context를 State Context(`isOpen`, `value`)와 Dispatch Context(함수들)로 분리해 리렌더 범위를 나눈다. ② 함수들을 `useCallback`으로 감싸 매 렌더마다 레퍼런스가 재생성되는 것을 막는다. ①만 하고 ②를 빠뜨리면 함수 레퍼런스가 계속 바뀌어 분리 효과가 사라진다.

**트레이드오프:** Provider가 2겹이 되고 훅도 State/Dispatch 두 개로 나뉜다. 소비하는 컴포넌트는 필요한 것에 맞는 훅을 골라 구독해야 하므로 보일러플레이트가 늘어난다. 또한 이 최적화는 앱 규모가 클 때 유효하며, 소규모에서는 과한 복잡도가 될 수 있다.

**개선 방향:** 실제 코드는 아직 TODO 주석 단계 — 현재는 하나의 Context에 `useMemo`로 묶여 있음. State/Dispatch 분리로 개선 예정.

---

### Roving tabindex

**문제:** 옵션 전체에 `tabIndex=0`을 부여하면 Tab 키가 옵션마다 멈춰 Tab 순서를 오염시키고(옵션 20개면 Tab 20번), WAI-ARIA Listbox 표준과 어긋난다.

**선택(현재 코드):** 방향키 핸들러가 `.focus()`로 화면 포커스만 옮기고 `tabIndex`는 건드리지 않는다 — 즉 아직 roving이 아니다.

**트레이드오프:** 구현은 단순하지만 표준을 못 지킨다. 활성 옵션만 `0`, 나머지는 `-1`이어야 하는데 현재는 전부 `0`.

**개선 방향:** 방향키로 A→B 이동 시 ① 떠나는 A를 `tabIndex=-1`, ② 도착하는 B를 `tabIndex=0`, ③ B에 `.focus()`. "0은 항상 지금 포커스가 갈 옵션에" 유지하면, Tab으로 위젯을 나갔다 돌아와도 마지막 위치로 복귀한다.

---

### ARIA haspopup/role SSOT

**문제:** `aria-haspopup`(Trigger)과 `role`(Content)이 각자 파일에 `"listbox"` 문자열로 독립 하드코딩돼 있어, 항상 수동으로 일치시켜야 한다.

**선택(현재 코드):** 각각 독립 선언.

**트레이드오프:** 한쪽만 바꿔도 컴파일·런타임 에러 없이 화면도 정상적으로 흘러간다(silent failure). TypeScript도 둘 다 `string` 타입이라 불일치를 못 막는다. 스크린리더가 "예고한 위젯(haspopup)"과 "실제 위젯(role)"을 다르게 인식해 접근성이 깨지는데, 에러가 안 나서 개발자가 발견하기 가장 어렵다 — `axe` 같은 접근성 테스트나 실제 스크린리더로만 잡힌다.

**개선 방향:** `"listbox"` 값을 모듈 상수 하나로 추출해 두 파일이 import. Context가 아닌 모듈 상수인 이유는, 이 값이 인스턴스마다 달라지지 않는 전역 고정값이기 때문.

---

### 키보드 내비게이션

**문제:** 방향키 핸들러가 매 입력마다 `querySelectorAll`로 옵션을 재스캔해 리스트가 길수록 비용이 쌓인다.

**선택:** 현재 위치를 `document.activeElement`로 판단(별도 state 없음). `querySelectorAll`과 `document.activeElement`의 차이는 비용 vs 안정성(desync)의 트레이드오프다.

**트레이드오프:** desync는 없지만(진실의 출처가 브라우저 하나), DOM 재스캔 비용과 테스트 번거로움이 있다.

**개선 방향:** 옵션 목록을 캐싱하고 DOM 변경 시에만 무효화, 또는 검증된 라이브러리에 위임.

---

### createPortal

**문제:** 드롭다운을 부모 안에 렌더하면 조상의 `overflow: hidden`·`z-index`·`transform`에 갇혀 화면 위로 못 뜬다.

**선택:** `createPortal(children, document.body)`로 DOM 위치를 `body`로 이동.

**트레이드오프:** DOM 위치는 옮겨져도 React 이벤트는 React 트리(원래 JSX 위치)를 따라가 `onClick` 등은 정상 작동한다. 대신 CSS 상속(테마 클래스·CSS 변수)은 실제 DOM 트리를 타므로 끊길 수 있고, React 밖 순수 JS 리스너는 감지 못할 수 있다. 반대급부로 stacking context 문제는 해결된다.

---

### Overlay 외부 클릭

**문제:** 바깥 클릭 시 닫혀야 하지만 Content(옵션 리스트) 클릭 시엔 닫히면 안 된다.

**선택:** Overlay(투명 배경)의 `onClick`에서 `close()` 호출. Overlay와 Content는 형제 관계로 렌더.

**근거:** 이벤트 버블링은 클릭된 요소의 조상으로만 전파된다. Content와 Overlay는 형제라 Content 클릭이 Overlay로 전파될 경로가 없어, 구조적으로 안전하다(코드 방어가 아니라 DOM 구조로 보장).

---

### 초기 포커스

**문제:** 드롭다운이 열려도 포커스가 안 따라가면 키보드/스크린리더 유저의 조작 위치와 청각 정보가 어긋난다.

**선택:** `isOpen`이 `true` 되는 순간 `contentRef`로 포커스 이동(`useEffect`).

**트레이드오프:** 닫힐 때 포커스 복원 로직이 없어 `body`로 떨어진다.

**개선 방향:** Select는 트리거가 항상 고정 하나이므로, Dialog처럼 `document.activeElement`를 저장할 필요 없이 `triggerRef`를 Context로 공유해 닫힐 때 `triggerRef.current?.focus()`로 복원.

---

### Esc + stopPropagation

**문제:** Esc 이벤트가 부모로 버블링된다. Select가 Dialog 등에 중첩되면 Esc 한 번에 여러 레이어가 동시에 닫힐 수 있다.

**선택:** `handleKeyDown`에서 `Escape` 시 `e.stopPropagation()` 후 `close()`.

**핵심 연결:** Portal로 DOM 위치는 `body`지만 React 이벤트는 React 트리를 타므로, Select는 여전히 Dialog의 논리적 자식이다. `stopPropagation`이 없으면 Esc가 Dialog까지 전파돼 함께 닫힌다.

**트레이드오프:** "안쪽 하나만 닫기"는 보장되지만, 바깥까지 함께 닫는 UX는 불가능해진다(Dialog와 동일). 개선하려면 `escapePropagates` 같은 prop으로 소비자에게 제어권 위임.
