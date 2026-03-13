## Button

- 초기버전
- 2026/01/16

### 목적

- 클릭 트리거 제공, disabled 처리

### 책임(하는 것)

- onClick 실행/차단
- disabled 상태 반영

### 비책임(하지 않는 것)

- 스타일/아이콘/레이아웃 결정
- 로딩 스피너 UI 제공(필요 시 확장)

### Props 초안

- onClick?: () => void
- disabled?: boolean
- type?: "button" | "submit" | "reset" (기본값 button)
- asChild?: boolean (선택)

### 접근성 최소 기준

- <button> 기본 사용
- disabled 전달
- 키보드 Enter/Space 동작(기본 제공)

### 사용 예시(1개)

- <Button onClick={...} disabled={...} />

## 시기

- 데모버전
- 2026/03/12

# Headless Button 컴포넌트 설계 노트

## 1. 컴포넌트의 목적

- 이 Button 컴포넌트는 UI(스타일)를 강제하지 않고, HTML `<button>`의 기본 동작과 웹 접근성(a11y) 로직만 제공하는 Headless 컴포넌트다.

## 2. 핵심 구현 포인트 및 기술적 의사결정

### A. 다형성 (Polymorphism) 구현: `as`와 `asChild`

- **문제:** 기존에는 `<button>` 태그만 렌더링되어, React Router의 `<Link>`나 일반 `<a>` 태그로 버튼 모양을 띄워야 할 때 시맨틱 웹을 해치는 문제가 있었다.
- **해결 (`as`):** `PolymorphicComponentPropsWithRef` 제네릭 타입을 사용해 `as` prop으로 들어온 태그명으로 렌더링되도록 구현했다.
- **해결 (`asChild`):** 외부 커스텀 컴포넌트에 접근성과 이벤트를 그대로 주입하기 위해 Slot 패턴(`asChild`)을 도입했다. `React.cloneElement`를 사용해 자식 엘리먼트에 Button의 props를 안전하게 병합(`composedOnClick` 등)했다.

### B. 웹 접근성 (A11y) 디테일: `disabled` vs `aria-disabled`

- **의사결정:** 네이티브 `disabled` 속성을 쓰면 키보드(Tab) 포커스 자체가 불가능해져 스크린 리더 사용자가 버튼의 존재 자체를 알 수 없는 문제가 있다.
- **해결:** 네이티브 `<button>`일 때만 `disabled`를 주고, 그 외의 태그로 변형되거나 로딩 중(`isLoading`)일 때는 `aria-disabled="true"`와 `aria-busy="true"`를 부여했다. 동시에 `onClick` 이벤트 내부에서 `e.preventDefault()`를 호출해 논리적인 클릭 차단을 구현했다.

### C. 타입스크립트 트러블슈팅: `forwardRef` 제네릭 소실 현상

- **문제:** 다형성을 위해 제네릭 `C extends React.ElementType`을 썼으나, `React.forwardRef`로 감싸는 순간 제네릭 타입 파라미터가 날아가는 TS 한계가 있었다.
- **해결:** `ButtonRender`라는 순수 함수를 먼저 선언한 뒤, `forwardRef(ButtonRender) as <C...>` 형태로 타입 단언(Type Assertion)을 사용하여 외부 시그니처를 강제로 복원했다.

## 3. 면접 예상 질문 및 답변

- **Q. 왜 굳이 Headless 패턴으로 버튼을 만들었나요?**
  - A. (여기에 본인의 답변을 적어보세요)
- **Q. `asChild` 패턴에서 자식 엘리먼트가 이미 `onClick`을 가지고 있다면 어떻게 처리되나요?**
  - A. (여기에 `composedOnClick` 로직에 대한 설명을 적어보세요)

## 3. 면접 예상 질문 및 답변

- **Q1. 네이티브 button 태그에 disabled 속성을 주면 되는데, 왜 굳이 aria-disabled를 같이 활용하셨나요?**
  - A. 네이티브 disabled는 식당 문을 아예 잠가버려서 사용자가 문 앞에도 못 가게 막는 방식입니다. 반면 aria-disabled는 문은 열어두되 "현재 브레이크 타임입니다"라는 팻말을 걸어두는 방식과 같습니다. 스크린 리더 같은 보조 기기를 쓰는 사용자도 "아, 버튼이 있긴 한데 지금은 비활성화 상태구나"라고 상황을 정확히 인지할 수 있도록 UX(사용자 경험)를 배려하기 위해 두 방식을 분리해서 적용했습니다.

- **Q2. 컴포넌트에 extends React.ElementType 제네릭은 왜 사용하셨나요? 안 쓰면 어떤 문제가 발생하나요?**
  - A. 자판기에 '음료수'만 넣게 만드는 안전장치 역할입니다. 이걸 쓰지 않으면 동료 개발자가 실수로 <Button as={123}>이나 <Button as="potato">처럼 존재하지 않는 태그를 넣어도 타입스크립트가 에러를 뱉지 않습니다. 결국 사용자가 보는 화면(런타임)에서 앱이 뻗거나 에러가 터지는 대참사를 컴파일 단계에서 '사전에 차단'하기 위해 사용했습니다.

- **Q3. Omit을 사용해 속성을 제거한 이유가 뭔가요? 그냥 합치면 안 되나요?**
  - A. HTML 기본 속성과 저희가 커스텀으로 만든 속성의 **'타입 충돌'**을 막기 위해서입니다. 이력서 양식을 합칠 때 중복되는 칸이 있으면 헷갈리듯이, 타입스크립트도 disabled 같은 속성이 양쪽에 다 있으면 어느 걸 따라야 할지 몰라 에러를 뱉습니다. 그래서 Omit으로 겹치는 기본 속성을 미리 깔끔하게 제거한 후 안전하게 병합했습니다.

- **Q4. forwardRef를 쓸 때 마지막에 as로 타입을 단언해 준 이유가 뭔가요?**
  - A. 실제 코드가 돌아가는 런타임에는 문제가 없지만, forwardRef로 감싸는 순간 타입스크립트가 유동적인 제네릭 타입(C)을 잃어버리고 기본값으로 고정해버리기 때문입니다. 그래서 as를 사용해 "이 컴포넌트는 C 타입을 유동적으로 받는다"는 올바른 설명서를 타입스크립트에게 강제로 다시 씌워주어(타입 복원), 컴포넌트를 사용할 때 억울한 타입 에러가 나지 않도록 처리했습니다.

# 끄적임

## 고유 props전

- omit ? : 설명을보니 어느정도 기억은남 사용법기억안남(사용법이란 왜저렇게 코드를 쓴건지 모르겠고 작동하는지도 모르겠)
- as 어찌 사용하는거였더라 여기서 적용하면 무엇이 되는지 어찌 바뀌는지 헷갈림
- extends?
- // React.ComponentPropsWithRef에서 ref만 꺼내는 방식으로, 엘리먼트마다 달라지는
  // HTMLElement 서브타입(e.g. HTMLButtonElement, HTMLAnchorElement)을 자동으로 따라간다. 2가지의 이점을 모르겠다
- ref 또한 그럼 // 2개의 타입의 존재 이유를 위에만봤을때 모름

## 고유 props후

- /\*\*
  - 비동기 작업 진행 중 상태.
  - `disabled`와 동일하게 클릭을 차단하며, 추가로 aria-busy를 설정해
  - 스크린 리더에 "현재 처리 중"임을 알린다.
    \*/
    isLoading?: boolean;
    // 이부분에서 `disabled`와 동일하게 클릭을 차단하며, 추가로 aria-busy를 설정해 2문맥이 헷갈리는데 로딩상태로 클릭 차단은 이해되지만 aria-busy 가무엇인가

- export type ButtonProps<C extends React.ElementType = "button"> =
  PolymorphicComponentPropsWithRef<C, ButtonOwnProps>;
  여기에 as Prop으로 교체가능이 안보임

## 접근성 속성이후

- 사실 여기서부턴 그냥 읽고 따지지 도 못하겠다 뭔가 그렇구나 이렇게됨 하 js가 너무 부족해서 잘못선택했나 생각이듬 그냥 이력서 수정하고 원래있는 프로젝트 수정해서 지원하는게 맞았나 라는 생각 - 하면안되는 후회가 듬 , 그리고 1년전에 이런 공부하고 취직했어야되지않나나 코딩이 죽어든다는데;;고민은 여기까지 다시 집중

- // disabled/loading 상태에서 이벤트 버블링과 기본 동작을 모두 차단한다.
  // onPointerDown 대신 onClick을 막는 이유: form submit·anchor navigate 등
  // 브라우저 기본 동작이 click 이벤트에서 발생하기 때문이다.
  여기부분은 완벽히 왜안되는지 이해는안됬지만 저런 비슷한 현상을 격었던 비스무리한 기억

## asChild: Slot

- // 타입 불일치를 해소한다. asChild에서는 실제 타깃이 HTMLButtonElement가 아닐 수 있으므로
  // 단언(as)으로 처리한다. 흠 헷갈리긴한데 이건 type의 제네릭을 모르지만 위에부분을 그렇구나 하면 문맥상이해가 됨

## 기본 렌더: as prop 또는 <button>

- ref의 내부 타입(ForwardedRef<unknown>)과 JSX 엘리먼트가 기대하는 타입이
  // 일치하지 않으므로 단언한다 - ?? 를통해서 사전에 방지 한다는걸까 그래서 외부 에서 이미 올바른 걸 보장한다는거고? 아니면 never때문에 ?
-       // type을 명시하지 않으면 form 내부의 <button>이 submit으로 동작하는
      // 브라우저 기본값 때문에 의도치 않은 제출이 발생한다.  > 그렇기때문에 ?( type ?? "button")을했다는걸까 아님 : type을 말하는걸까
- // 네이티브 `disabled`는 포커스를 완전히 제거하므로 <button> 전용으로만 전달.
  // <a>·커스텀 컴포넌트에는 aria-disabled + handleClick 차단으로 대체한다.
  disabled={isNativeButton ? isDisabled : undefined}
  onClick={handleClick} 특히 2번째 줄을 잘모르겟 aria-disabled부분

## forwardRef

- (Props, Ref) 이것만 가능하니까 as를 통해서 제네릭을 복원?( 복원이 어디서 이루어진지 설명좀)한다는거고 다양한곳에서 사용되는 테크닉이다 ?
