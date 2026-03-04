import React, { forwardRef, cloneElement, isValidElement, Children } from "react";

// ============================================================
// 다형성(Polymorphic) 타입 유틸리티
//
// `as` prop으로 렌더링되는 HTML 엘리먼트(또는 컴포넌트)를 호출부에서 교체할 수 있게 한다.
// Omit을 사용해 컴포넌트 고유 Props와 이름이 겹치는 HTML 속성 키를 제거함으로써
// 타입 충돌을 방지하고 호출부에서 정확한 자동완성을 제공한다.
// ============================================================

type PolymorphicComponentProps<
  C extends React.ElementType,
  OwnProps extends object = object
> = OwnProps &
  Omit<React.ComponentPropsWithoutRef<C>, keyof OwnProps | "as"> & {
    as?: C;
  };

// forwardRef와 함께 다형성을 구현할 때, ref 타입을 대상 엘리먼트로부터 정확히 추론하기 위한 타입.
// React.ComponentPropsWithRef에서 ref만 꺼내는 방식으로, 엘리먼트마다 달라지는
// HTMLElement 서브타입(e.g. HTMLButtonElement, HTMLAnchorElement)을 자동으로 따라간다.
type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

type PolymorphicComponentPropsWithRef<
  C extends React.ElementType,
  OwnProps extends object = object
> = PolymorphicComponentProps<C, OwnProps> & {
  ref?: PolymorphicRef<C>;
};

// ============================================================
// Button 고유 Props
// ============================================================

type ButtonOwnProps = {
  /**
   * Slot 패턴: true이면 Button 자체를 렌더하지 않고
   * 단일 자식 엘리먼트에 모든 props(ref·접근성 포함)를 위임한다.
   * 예: <Button asChild><a href="/home">홈</a></Button>
   *
   * Radix UI <Slot>과 동일한 개념으로, 외부 의존성 없이 직접 구현했다.
   * `as`와 달리 자식의 실제 컴포넌트 타입·구조를 완전히 유지할 수 있다.
   */
  asChild?: boolean;
  /**
   * 비동기 작업 진행 중 상태.
   * `disabled`와 동일하게 클릭을 차단하며, 추가로 aria-busy를 설정해
   * 스크린 리더에 "현재 처리 중"임을 알린다.
   */
  isLoading?: boolean;
};

// ============================================================
// 공개 타입: 기본 엘리먼트를 "button"으로 두되, as prop으로 교체 가능
// ============================================================

export type ButtonProps<C extends React.ElementType = "button"> =
  PolymorphicComponentPropsWithRef<C, ButtonOwnProps>;

// ============================================================
// 내부 렌더 함수 (forwardRef로 감싸기 전 순수 제네릭 함수)
// ============================================================

function ButtonRender<C extends React.ElementType = "button">(
  props: ButtonProps<C>,
  // forwardRef의 내부 시그니처는 ForwardedRef<unknown>을 요구한다.
  // 외부로 노출되는 타입 정확도는 아래 `as` 단언으로 복원하므로 여기서는 unknown을 허용한다.
  ref: React.ForwardedRef<unknown>
) {
  // 함수 본문에서 제네릭 교차 타입(intersection)을 직접 구조 분해하면
  // TypeScript가 각 키의 타입을 좁히지 못한다.
  // 기본 타입("button")으로 단언한 뒤 처리하는 것이 관용적인 우회 패턴이다.
  const {
    as,
    asChild = false,
    isLoading = false,
    disabled = false,
    onClick,
    type,
    children,
    ...rest
  } = props as ButtonProps<"button"> & { as?: React.ElementType };

  const isDisabled = disabled || isLoading;

  // ── 접근성 속성 ─────────────────────────────────────────────────────────
  // aria-disabled: 네이티브 `disabled`와 달리 포커스를 빼앗지 않는다.
  //   키보드 사용자가 컴포넌트에 접근한 채로 로딩 완료를 기다릴 수 있어
  //   UX와 접근성 모두에 유리하다.
  // aria-busy: ARIA 1.1 속성. 비동기 작업 중임을 스크린 리더에 알린다.
  // data-*  : 소비자(Consumer)가 CSS 선택자로 상태 기반 스타일을 적용하도록
  //   명시적으로 노출한다. 헤드리스 컴포넌트의 핵심 계약(Contract)이다.
  const a11yProps = {
    "aria-disabled": isDisabled || undefined,
    "aria-busy": isLoading || undefined,
    "data-disabled": isDisabled || undefined,
    "data-loading": isLoading || undefined,
  };

  // disabled/loading 상태에서 이벤트 버블링과 기본 동작을 모두 차단한다.
  // onPointerDown 대신 onClick을 막는 이유: form submit·anchor navigate 등
  // 브라우저 기본 동작이 click 이벤트에서 발생하기 때문이다.
  const handleClick = isDisabled
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }
    : onClick;

  // ── asChild: Slot 패턴 ─────────────────────────────────────────────────
  if (asChild) {
    const onlyChild = Children.only(children as React.ReactNode);

    if (!isValidElement(onlyChild)) {
      throw new Error(
        "[Button] asChild 사용 시 단일 React 엘리먼트를 자식으로 전달해야 합니다."
      );
    }

    // 자식이 이미 보유한 onClick과 Button의 onClick을 합성해 둘 다 실행한다.
    // disabled 상태이면 자식의 onClick도 막아 일관된 차단 동작을 보장한다.
    const childOnClick = (
      onlyChild.props as { onClick?: React.MouseEventHandler }
    ).onClick;

    // e의 제네릭 타입을 Element로 고정해 handleClick(HTMLButtonElement 기반)과의
    // 타입 불일치를 해소한다. asChild에서는 실제 타깃이 HTMLButtonElement가 아닐 수 있으므로
    // 단언(as)으로 처리한다.
    const composedOnClick = (e: React.MouseEvent) => {
      if (typeof handleClick === "function")
        (handleClick as (e: React.MouseEvent) => void)(e);
      if (!isDisabled && typeof childOnClick === "function") childOnClick(e);
    };

    return cloneElement(
      onlyChild as React.ReactElement<Record<string, unknown>>,
      { ...rest, ...a11yProps, ref, onClick: composedOnClick }
    );
  }

  // ── 기본 렌더: as prop 또는 <button> ───────────────────────────────────
  const Tag: React.ElementType = as ?? "button";
  const isNativeButton = Tag === "button";

  return (
    <Tag
      {...rest}
      // ref의 내부 타입(ForwardedRef<unknown>)과 JSX 엘리먼트가 기대하는 타입이
      // 일치하지 않으므로 단언한다. 외부 시그니처에서 이미 올바른 타입을 보장한다.
      ref={ref as React.Ref<never>}
      {...a11yProps}
      // type을 명시하지 않으면 form 내부의 <button>이 submit으로 동작하는
      // 브라우저 기본값 때문에 의도치 않은 제출이 발생한다.
      type={isNativeButton ? (type ?? "button") : type}
      // 네이티브 `disabled`는 포커스를 완전히 제거하므로 <button> 전용으로만 전달.
      // <a>·커스텀 컴포넌트에는 aria-disabled + handleClick 차단으로 대체한다.
      disabled={isNativeButton ? isDisabled : undefined}
      onClick={handleClick}
    >
      {children}
    </Tag>
  );
}

// ============================================================
// forwardRef 래핑 및 다형성 타입 복원
//
// React.forwardRef는 단일 타입 파라미터 쌍(Props, Ref)만 지원하므로
// 제네릭 렌더 함수를 그대로 넘기면 타입 파라미터 C가 소실된다.
// `as` 타입 단언으로 원래의 제네릭 시그니처를 복원하는 것은
// Radix UI · Headless UI · MUI 등 주요 라이브러리에서도 동일하게 사용하는
// 확립된 패턴이다.
// ============================================================
export const Button = forwardRef(ButtonRender) as <
  C extends React.ElementType = "button"
>(
  props: ButtonProps<C>
) => React.ReactElement | null;
