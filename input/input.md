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
<Input
  label="Email"
  placeholder="you@example.com"
  onChange={(value) => console.log(value)}
/>
```
