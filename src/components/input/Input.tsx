import React, { forwardRef, useId } from "react";

// ============================================================
// Input 고유 Props
//
// 네이티브 InputHTMLAttributes를 그대로 쓰되, 두 가지를 오버라이드한다.
//   1) onChange: 네이티브 SyntheticEvent 대신 값(string)만 전달
//      → 소비자가 이벤트 객체 구조에 의존하지 않아도 되고,
//        React 외 환경(e.g. RN, Preact)으로 포팅할 때도 인터페이스가 유지된다.
//   2) id: 없으면 useId()로 자동 생성 (label 연결을 위해 항상 존재해야 함)
// ============================================================

type InputOwnProps = {
  /**
   * 렌더링할 가시적 레이블 텍스트.
   * 제공되면 <label htmlFor> 방식으로 input과 연결한다.
   * 시각적 레이블이 없는 경우에는 ariaLabel을 사용할 것.
   */
  label?: string;

  /**
   * 시각적 label이 없을 때 스크린 리더에 노출할 텍스트.
   * label prop이 함께 전달되면 무시된다(visible label이 우선).
   *
   * 접근성 원칙: 모든 input에는 반드시 레이블이 있어야 한다.
   * WCAG 2.1 Success Criterion 1.3.1, 4.1.2 참고.
   */
  ariaLabel?: string;

  /**
   * 입력값이 유효하지 않은 상태.
   * true이면 aria-invalid="true"를 input에 자동 설정해
   * 스크린 리더가 오류 상태를 인식할 수 있게 한다.
   *
   * HTML의 :invalid 의사 클래스와 달리 aria-invalid는
   * 소비자가 검증 시점을 직접 제어할 수 있다는 장점이 있다.
   */
  invalid?: boolean;

  /**
   * input 아래 렌더링할 설명 텍스트 (helper text / error message 등).
   * 제공되면 내부에서 고유 id를 부여한 <span>을 렌더하고
   * input의 aria-describedby에 자동 연결한다.
   */
  description?: string;

  /**
   * 이미 DOM에 존재하는 외부 설명 요소의 id.
   * description prop과 함께 사용하면 두 id를 공백으로 병합한다.
   * (WAI-ARIA 명세: aria-describedby는 공백 구분 id 목록을 허용)
   *
   * 예: 폼 수준의 에러 summary 박스와 연결할 때 유용.
   */
  describedById?: string;

  /**
   * SyntheticEvent 대신 값(string)만 전달하는 onChange.
   * Headless 컴포넌트는 이벤트 세부 구현을 추상화하고 값의 흐름만 노출한다.
   */
  onChange?: (value: string) => void;
};

// 네이티브 onChange를 위에서 정의한 커스텀 onChange로 완전히 교체한다.
// Omit을 사용하지 않으면 타입 충돌로 인해 소비자가 두 시그니처 중 하나만
// 사용할 수 없게 되는 문제가 생긴다.
export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> &
  InputOwnProps;

// ============================================================
// Input 컴포넌트
//
// 헤드리스 설계 원칙: 이 컴포넌트는 내부 상태를 보유하지 않는다.
//
// "내부 상태 없음"의 이유:
//   - value를 내부에서 관리하면 소비자가 값을 읽거나 초기화하려 할 때
//     ref나 콜백 같은 탈출구(escape hatch)가 필요해진다.
//   - 상태 소유권을 소비자에게 넘기면 단일 진실 공급원(single source of truth)이
//     명확해지고, 폼 라이브러리(react-hook-form, Formik 등)와도 충돌 없이 통합된다.
//   - Controlled(value + onChange)와 Uncontrolled(defaultValue) 모두
//     네이티브 <input>의 동작에 그대로 위임하면 된다.
// ============================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: idProp,
      label,
      ariaLabel,
      invalid = false,
      description,
      describedById,
      onChange,
      type = "text",
      ...rest
    },
    ref
  ) => {
    // useId: React 18 내장 훅. 서버/클라이언트 렌더링 양쪽에서 동일한 id를 생성해
    // 하이드레이션 불일치(hydration mismatch)를 방지한다.
    // 소비자가 id를 명시하면 그것을 우선하고, 없으면 자동 생성 id를 사용한다.
    const generatedId = useId();
    const inputId = idProp ?? generatedId;

    // description 요소에 부여할 id: 입력 필드 id를 기반으로 파생시켜
    // 같은 페이지에 여러 Input이 있어도 충돌하지 않도록 한다.
    const descriptionId = `${inputId}-description`;

    // aria-describedby에 연결할 id 목록을 구성한다.
    // 내부 description과 외부 describedById를 모두 지원하며,
    // 둘 다 있으면 공백으로 이어붙인다. 어느 쪽도 없으면 속성 자체를 생략(undefined).
    const describedBy =
      [description ? descriptionId : undefined, describedById]
        .filter(Boolean)
        .join(" ") || undefined;

    // 네이티브 ChangeEvent를 가로채 value만 추출한 뒤 소비자 onChange로 전달한다.
    // 소비자가 onChange를 넘기지 않은 경우(uncontrolled)에는 아무것도 하지 않는다.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      // Fragment를 사용해 불필요한 래퍼 DOM 노드를 생성하지 않는다.
      // 레이아웃(label/input/description의 배열 방식)은 소비자의 책임이다.
      <>
        {label && (
          // htmlFor + id 연결: 스크린 리더와 클릭 포커스 이동 모두 지원하는
          // 가장 견고한 레이블 연결 방식이다.
          <label htmlFor={inputId}>{label}</label>
        )}

        <input
          {...rest}
          id={inputId}
          ref={ref}
          type={type}
          // label이 없을 때만 aria-label을 설정한다.
          // 둘 다 존재하면 aria-label이 label을 덮어써 혼란을 줄 수 있다.
          aria-label={!label ? ariaLabel : undefined}
          // invalid=true → "true" 문자열로 렌더. false이면 속성 자체를 생략(undefined).
          // aria-invalid="false"를 명시적으로 넣는 것은 불필요한 노이즈가 된다.
          aria-invalid={invalid || undefined}
          // 연결된 설명 요소 id를 전달해 스크린 리더가 입력 후 설명을 읽을 수 있게 한다.
          aria-describedby={describedBy}
          onChange={handleChange}
        />

        {description && (
          // id를 부여해 aria-describedby의 타깃이 된다.
          // role을 별도로 지정하지 않아도 aria-describedby 연결만으로
          // 스크린 리더가 포커스 시 내용을 읽어준다.
          <span id={descriptionId}>{description}</span>
        )}
      </>
    );
  }
);

Input.displayName = "Input";
