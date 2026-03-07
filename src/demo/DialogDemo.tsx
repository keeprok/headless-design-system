import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../components";

export function DialogDemo() {
  return (
    <div>
      {/* Uncontrolled: defaultOpen 없이 사용하면 닫힌 상태로 시작 */}
      <Dialog>
        <DialogTrigger>모달 열기</DialogTrigger>

        <DialogPortal>
          {/* Overlay: 클릭 시 닫힘 */}
          <DialogOverlay />

          {/* Content: ESC 키 닫힘, 포커스 트랩, aria 자동 연결 */}
          <DialogContent>
            <DialogTitle>알림</DialogTitle>
            <DialogDescription>
              이 모달은 ESC 또는 닫기 버튼, Overlay 클릭으로 닫을 수 있습니다.
            </DialogDescription>
            <DialogClose>닫기</DialogClose>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </div>
  );
}
