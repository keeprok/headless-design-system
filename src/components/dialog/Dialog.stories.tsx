import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './Dialog';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 40,
};

const contentStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#fff',
  padding: '24px',
  zIndex: 50,
  minWidth: '300px',
  borderRadius: '8px',
};

// 재사용 가능한 기본 Dialog 구조
function SampleDialog() {
  return (
    <DialogRoot>
      <DialogTrigger>모달 열기</DialogTrigger>
      <DialogPortal>
        <DialogOverlay style={overlayStyle} />
        <DialogContent style={contentStyle}>
          <DialogTitle>알림</DialogTitle>
          <DialogDescription>
            ESC 키, 닫기 버튼, 또는 배경 클릭으로 닫을 수 있습니다.
          </DialogDescription>
          <DialogClose>닫기</DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  );
}

const meta = {
  component: DialogRoot,
  tags: ['ai-generated', 'needs-work'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '120px', padding: '24px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DialogRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

// 트리거 클릭 → Portal로 dialog 렌더 확인
export const Default: Story = {
  args: { children: null },
  render: () => <SampleDialog />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /모달 열기/i }));
    // Portal은 document.body에 렌더되므로 ownerDocument.body 기준으로 쿼리
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

// ESC 키 → dialog 닫힘 확인
export const EscToClose: Story = {
  args: { children: null },
  render: () => <SampleDialog />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /모달 열기/i }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('dialog')).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};

// 닫기 버튼 클릭 → dialog 닫힘 확인
export const CloseButton: Story = {
  args: { children: null },
  render: () => <SampleDialog />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: /모달 열기/i }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('button', { name: /닫기/i }));
    await expect(body.queryByRole('dialog')).toBeNull();
  },
};
