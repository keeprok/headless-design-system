## Input (TextField)

### 목적

- 텍스트 입력 필드 제공
- label/invalid 등 접근성 기반 입력 경험 제공

### 책임(하는 것)

- `<input>` 기반 텍스트 입력 제공
- label 연결(id/for 또는 aria-label) 지원
- invalid 상태 표현(aria-invalid)
- (선택) helper/description 연결(aria-describedby)

### 비책임(하지 않는 것)

- 스타일/아이콘/레이아웃 결정
- 포맷팅/마스킹(전화번호, 날짜 등) 처리
- 폼 검증 로직(유효성 판단) 자체 제공
- debounce/search 같은 비즈니스 로직 제공

### 상태 설계

- 내부 상태 없음(기본)
- Controlled/Uncontrolled 모두 허용:
  - value + onChange (Controlled)
  - defaultValue (Uncontrolled)

### Props 초안

- value?: string
- defaultValue?: string
- onChange?: (value: string) => void
- disabled?: boolean
- placeholder?: string
- type?: string (기본값: "text")
- name?: string
- id?: string (없으면 내부에서 생성 가능 - 선택)
- label?: string (선택: 제공 시 label 렌더)
- ariaLabel?: string (label이 없을 때 대체)
- invalid?: boolean
- description?: string (선택)
- describedById?: string (선택, 외부 확장 포인트)

### 접근성 최소 기준

- label이 있으면 input과 연결해야 함
  - `id` + `<label htmlFor>` 또는 aria-label/aria-labelledby
- invalid이면 `aria-invalid="true"`
- description이 있으면 `aria-describedby`로 연결
- disabled는 `<input disabled>`로 전달

### 사용 예시(기본)

```tsx
<Input label="Email" placeholder="you@example.com" onChange={(value) => console.log(value)} />
```

# 끄적임

## 고유props

- 네이티브 InputHTMLAttributes를 그대로 쓰되, 두 가지를 오버라이드한다.
  // 1) onChange: 네이티브 SyntheticEvent 대신 값(string)만 전달
  // → 소비자가 이벤트 객체 구조에 의존하지 않아도 되고,
  // React 외 환경(e.g. RN, Preact)으로 포팅할 때도 인터페이스가 유지된다. - 어느정도 알겟지만 모르겠다는 느낌 React 외 환경(e.g. RN, Preact)으로 포팅할 때도 특히여기

- htmlFor?
- 시각적 레이블이 없는 경우에는 ariaLabel을 사용할 것.?
- 접근성 원칙: 모든 input에는 반드시 레이블이 있어야 한다. 이거 위는 아는데 접근성원칙?
  - WCAG 2.1 Success Criterion 1.3.1, 4.1.2 참고.모름
- aria-describedby ?
- - 이미 DOM에 존재하는 외부 설명 요소의 id.
  - description prop과 함께 사용하면 두 id를 공백으로 병합한다.
  - (WAI-ARIA 명세: aria-describedby는 공백 구분 id 목록을 허용)
  -
  - 예: 폼 수준의 에러 summary 박스와 연결할 때 유용.
  * 설명 필요
- - SyntheticEvent 대신 값(string)만 전달하는 onChange.

* Headless 컴포넌트는 이벤트 세부 구현을 추상화하고 값의 흐름만 노출한다. 헷갈린다

- // 네이티브 onChange를 위에서 정의한 커스텀 onChange로 완전히 교체한다.
  // Omit을 사용하지 않으면 타입 충돌로 인해 소비자가 두 시그니처 중 하나만
  // 사용할 수 없게 되는 문제가 생긴다. 왜지?

## Input 컴포넌트

- ref나 콜백 같은 탈출구(escape hatch)가 필요해진다. 읽고나니 맞지 지만 왜 내부상태없음을 해야되냐고 물으면 한번에 안나올듯
- 상태 소유권을 소비자에게 넘기면 단일 진실 공급원 여기서 소유권과 공급원이 뭐지 그리고왜 충돌이없지 formik도 뭐지 hook-form은 알지만 왜 충돌이없는지 궁금
- // description 요소에 부여할 id: 입력 필드 id를 기반으로 파생시켜
  // 같은 페이지에 여러 Input이 있어도 충돌하지 않도록 한다.어찌한다는건지 궁금
  id: 1 ,id : 1-description으로 구분한다는건가
- aria-describedby 안보임
  - [description ? descriptionId : undefined, describedById]
    .filter(Boolean)
    .join(" ") || undefined; 이부분에서 descriptionId 이것만 undefined아닌가
- 네이티브 ChangeEvent를 가로채 value만 추출한 뒤 소비자 onChange로 전달한다.
  - 가로채는거 어디있지 안보임 알고있는개념인데 햇갈린다 아는개념으로는 api 사용할때 가로채서 비동기화시키고 하는거였는데 흠... 이것도 헷갈리네 axiosIntstance에서였나
- // 소비자가 onChange를 넘기지 않은 경우(uncontrolled)에는 아무것도 하지 않는다.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  onChange?.(e.target.value);
  };
  - 입력(onchange)가없으면 작동하지않는다는의미일까?
- Fragment를 사용해 불필요한 래퍼 DOM 노드를 생성하지 않는다.?
- // 레이아웃(label/input/description의 배열 방식)은 소비자의 책임이다.
  - 여기서 소비자가 디자인시스템사용하는 코더 or 빌더 이야기겠지?

- htmlFor + id 연결: 스크린 리더와 클릭 포커스 이동 모두 지원하는
  // 가장 견고한 레이블 연결 방식이다. 유명한거같으니 알고싶다 알려줘
- aria-label ?
  둘다 존재한다는 예시에서는 그럼 안써야되는건가 쓰게되면 무조건 aria-label 가 우선?
- invalid 은 기본이 false인거라는뜻 이겠지 그리고
- 연결된 설명 요소 id를 전달해 스크린 리더가 입력 후 설명을 읽을 수 있게 한다. ??
- // id를 부여해 aria-describedby의 타깃이 된다.
  // role을 별도로 지정하지 않아도 aria-describedby 연결만으로
  // 스크린 리더가 포커스 시 내용을 읽어준다. ??
