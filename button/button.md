## Button

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

- 초기버전
- 2026/01/16
