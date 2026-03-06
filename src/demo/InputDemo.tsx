import { useRef, useState } from "react";
import { Input } from "../components";

export function InputDemo() {
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isInvalid = email.length > 0 && !email.includes("@");

  return (
    <div>
      {/* Controlled: value + onChange */}
      <Input
        label="이메일"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        invalid={isInvalid}
        description={isInvalid ? "@가 포함되어야 합니다." : "업무용 이메일을 입력해 주세요."}
      />

      {/* Uncontrolled: defaultValue만 전달 */}
      <Input
        label="이름"
        defaultValue="홍길동"
        ref={inputRef}
      />

      {/* 시각적 label 없이 aria-label만 사용 */}
      <Input
        ariaLabel="검색어 입력"
        placeholder="검색..."
      />

      {/* 외부 설명 요소 연결 */}
      <p id="pw-hint">영문·숫자·특수문자 포함 8자 이상</p>
      <Input
        label="비밀번호"
        type="password"
        describedById="pw-hint"
      />

      {/* disabled */}
      <Input
        label="읽기 전용 필드"
        value="수정 불가"
        disabled
      />
    </div>
  );
}
