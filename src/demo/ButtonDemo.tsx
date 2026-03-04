import { Button } from "../components";

export function ButtonDemo() {
  return (
    <div>
      {/* 기본 사용: <button type="button"> */}
      <Button onClick={() => alert("Pressed")}>기본 버튼</Button>

      {/* disabled 상태: 네이티브 disabled + aria-disabled 동시 적용 */}
      <Button disabled>비활성 버튼</Button>

      {/* isLoading 상태: aria-busy + aria-disabled, 클릭 차단 */}
      <Button isLoading>로딩 중...</Button>

      {/* as prop: <button> 대신 <a> 엘리먼트로 렌더 */}
      <Button as="a" href="/home">
        링크처럼 보이는 버튼
      </Button>

      {/* asChild: <Button> 자체는 렌더하지 않고 자식 <a>에 props 위임 */}
      <Button asChild>
        <a href="/about">asChild 링크</a>
      </Button>

      {/* form submit */}
      <form onSubmit={(e) => { e.preventDefault(); alert("Submitted"); }}>
        <Button type="submit">제출</Button>
      </form>
    </div>
  );
}
