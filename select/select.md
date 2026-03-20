# 끄적임

## 📝 1차 뼈대 (Select.Root) 설계 노트 및 끄적임

- **Q1. 여러 개 선택(다중 선택)은 어떻게 되는가? 옵션은 어디서 오나?**

- 팩트: 현재 425가 짜준 이 뼈대는 오직 '단일 선택(Single Select)' 전용입니다. 값이 string 하나뿐이니까요. 다중 선택을 하려면 string[] (배열)로 구조를 완전히 엎어야 하므로 지금은 생각하지 마십시오.

- 옵션들은 나중에 3~4차 뼈대에서 <Select.Option value="apple">사과</Select.Option> 형태로 부모 컴포넌트 안에 자식으로 꽂힐 예정입니다.

- **Q2 & Q3. 양방향 통신? Controlled? Uncontrolled? 이게 대체 무슨 소리인가?**

- 비제어 (Uncontrolled - 독고다이 모드):
  동료 개발자가 <SelectRoot defaultValue="apple"> 이렇게만 썼다고 칩시다.
  이때는 SelectRoot가 자기 안에 있는 useState(uncontrolledValue)를 써서 스스로 값을 기억하고 스스로 바꿉니다. 외부(부모)의 간섭을 일절 받지 않습니다.

- 제어 (Controlled - 꼭두각시 모드):
  동료 개발자가 <SelectRoot value={formValue} onChange={setFormValue}> 이렇게 썼다고 칩시다. (이게 react-hook-form을 쓸 때의 방식입니다.)
  이 순간부터 SelectRoot 내부의 useState는 완전히 무시(사망)됩니다. Select는 오직 부모가 위에서 꽂아주는 controlledValue만 쳐다봐야 합니다. 사용자가 다른 옵션을 클릭해도 자기가 직접 값을 바꾸지 못하고, 무전기(onChange)를 들어서 부모에게 **"유저가 바나나 눌렀습니다! 값 바꿔주세요!"**라고 보고만 합니다.

- 왜 isControlled 코드를 짰는가? (최고급 설계 논리):
  우리는 '앱'을 만드는 게 아니라, 다른 동료들이 가져다 쓸 **'공용 라이브러리(Headless)'**를 만들고 있습니다. 동료가 제어 모드로 쓸지, 비제어 모드로 쓸지 우리는 모릅니다.
  그래서 코드가 **"어? 부모가 value를 주입했네? 그럼 난 꼭두각시(Controlled)로 동작해야지. 어? 아무것도 안 줬네? 그럼 내 내부 상태(Uncontrolled)로 동작해야지"**라고 스스로 판단하게 만든 겁니다.

# 📝 3. 면접용 1차 뼈대 MD 변환

이 위대한 개념을 귀하의 언어로 면접관에게 쏘아붙일 수 있게 MD로 정리했습니다. 복사해서 1차 뼈대 끄적임에 덮어씌우십시오.

## 📝 1차 뼈대 (Select.Root) 설계 노트 및 끄적임

- **Q1. Select 컴포넌트에서 Controlled(제어)와 Uncontrolled(비제어) 패턴을 동시에 지원하도록 설계한 이유는?**

- 결론 (재사용성과 확장성): 범용적인 Headless UI 라이브러리로서, 소비자가 처한 상황(단순 로컬 상태 사용 vs react-hook-form 같은 전역 폼 상태 사용)을 모두 커버하기 위함이다.

- 외부에서 value prop이 주입되었는지 여부(isControlled)를 판별하여, 값이 있으면 부모의 상태를 구독하는 꼭두각시(Controlled)로, 없으면 내부 useState를 활용하는 독립 객체(Uncontrolled)로 유연하게 전환되도록 아키텍처를 설계했다.

- **Q2. onChange는 왜 필요한가? (양방향 통신)**

- 결론: Controlled 모드일 때, 자식 컴포넌트(Option)에서 유저의 클릭 이벤트가 발생하면 그 변경 사항을 외부(부모 Form)로 전달하여 실제 상태를 업데이트하게 만드는 유일한 '통신 채널'이다. 이 콜백이 있어야 상태의 단방향 데이터 흐름(Top-Down) 원칙이 지켜진다.

## 📝 2차 뼈대 (SelectTrigger) 설계 노트 및 끄적임

#### 질문

- aria-haspopup="listbox" // 접근성: "이 버튼을 누르면 리스트 박스가 열립니다"
  aria-expanded이거를 잘사용을 못하겠다 aria에 관해서 그리고 hasPopup이나 expanded등 필요한 상황에서 쓰는법

- 92번째 줄 onClick이 뒤에있는 이유는 포커싱의 혼돈을 주지않기위해 ?
- 127번째줄 onClick이 true일경우는 언재일지궁금하다
- React.ButtonHTMLAttributes<HTMLButtonElement> 이렇게 작성되는데 작성될떼ㅐ React.SelectHtmlAttributes<HTMLSellectElment>같은건 없나 정해져있는 범위가 궁금

## 📝 2차 뼈대 (SelectTrigger, Portal, Overlay) 설계 노트

**Q1. `aria-haspopup="listbox"`와 `aria-expanded`의 정확한 사용법과 존재 이유는?**

- **결론 (접근성 상태 동기화):** 시각 장애인 유저에게 UI의 '종류'와 '현재 상태'를 브리핑하는 필수 장치다. `haspopup="listbox"`는 단순히 창이 뜬다는 걸 넘어 "선택 가능한 목록(옵션) 창이 뜰 것"임을 정확히 예고한다. 또한 `aria-expanded={isOpen}`은 React의 내부 상태(`isOpen`)와 스크린 리더의 읽기 상태를 실시간으로 동기화하여 열림/닫힘 여부를 생중계한다.

**Q2. Trigger 내부 이벤트에서 `toggle()`이 외부 `onClick?.(e)`보다 먼저 실행되는 이유는?**

- **결론 (핵심 로직 우선 보장):** 컴포넌트의 본질적 책임(드롭다운 열고 닫기)을 최우선으로 실행하기 위함이다. 소비자가 주입한 외부 콜백 로직에서 런타임 에러가 터지더라도, UI의 기본 동작 자체는 씹히지 않도록 안전하게 실행 순서를 강제했다.

**Q3. Overlay의 외부 `onClick?.(e)`은 어떤 상황에서 쓰이는가?**

- **결론 (사이드 이펙트 확장성):** 배경 클릭 시 모달이 닫히는 기본 로직 외에, 소비자가 추가적인 행동을 원할 때를 대비한 구멍이다. 예를 들어 "유저가 선택을 포기하고 배경을 클릭했을 때 로그 분석 툴(GA)에 이벤트를 전송한다" 같은 커스텀 로직을 얹을 수 있도록 확장성을 열어둔 것이다.

**Q4. 왜 `SelectHTMLAttributes`가 아닌 `ButtonHTMLAttributes`를 상속받았는가?**

- **결론 (네이티브 한계 극복):** HTML 네이티브 `<select>` 태그는 브라우저(OS) 종속적이라 세밀한 CSS 커스텀이 거의 불가능하다. 이를 완전히 타파하고 자유로운 디자인 시스템을 구축하기 위해, 시맨틱하게 가장 적절한 클릭 요소인 `<button>`을 Trigger의 뼈대로 삼고 Headless Select를 밑바닥부터 재창조한 것이다.

## 📝 3, 4차 뼈대 (SelectContent, SelectOption) 설계 노트 및 끄적임

**Q1. Dialog에서는 `Tab` 키로 이동했는데, Select에서는 왜 방향키(`ArrowUp/Down`)를 사용하는가?**

- **결론 (WAI-ARIA 표준 준수):** 웹 접근성 표준에 따르면, 대화상자(Dialog) 내부는 `Tab`으로 순환하는 것이 맞지만, 목록(Listbox) 형태의 UI는 `Tab`을 누르면 컴포넌트를 완전히 빠져나가야 하고, 내부 옵션 간의 이동은 오직 '위/아래 방향키'로만 제어해야 한다. 이 엄격한 접근성 표준을 준수하기 위해 `keydown` 이벤트를 방향키 기준으로 분기 처리했다.

**Q2. Option 컴포넌트가 값을 직접 바꾸지 않고 `onChange` 콜백을 호출하는 이유는? (무전기 패턴)**

- **결론 (제어의 역전 - Inversion of Control):** `SelectOption`은 데이터(상태)를 소유하지 않는 멍청한(Dumb) 뷰(View) 컴포넌트로 설계되었다. 유저가 클릭하거나 Enter를 치면, 오직 Root에서 내려받은 `onChange`를 호출하여 "이 값이 선택되었다"는 신호만 위로 쏘아 올린다. 상태 변경의 책임은 오직 Root와 부모(Form)에게만 위임함으로써 단방향 데이터 흐름을 철저히 지켜냈다.

**Q3. `rest.onKeyDown?.(e)` 처럼 구조 분해 할당 없이 `rest` 객체에서 직접 이벤트를 호출한 이유는?**

- **결론 (방어적 코드와 확장성):** 컴포넌트가 소비자의 커스텀 이벤트를 삼켜버리는(Event Swallowing) 버그를 막기 위함이다. 내부적으로 필요한 `Enter/Space` 키보드 로직을 선행 처리한 후, 소비자가 `<Select.Option onKeyDown={...}>` 형태로 주입한 외부 콜백이 존재한다면 `rest` 객체에서 안전하게 꺼내어 체이닝(Chaining) 실행되도록 구현했다.
