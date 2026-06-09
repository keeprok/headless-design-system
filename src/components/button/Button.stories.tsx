import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from './Button';

const meta = {
  component: Button,
  tags: ['ai-generated', 'needs-work'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본 버튼 — aria-disabled가 설정되지 않아야 함
export const Default: Story = {
  args: { children: '저장하기' },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /저장하기/i });
    await expect(btn).toBeVisible();
    await expect(btn).not.toHaveAttribute('aria-disabled');
  },
};

// 로딩 상태 — aria-busy, aria-disabled 둘 다 "true"
export const Loading: Story = {
  args: { children: '저장 중...', isLoading: true },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /저장 중/i });
    await expect(btn).toHaveAttribute('aria-busy', 'true');
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
  },
};

// disabled — 네이티브 disabled 속성
export const Disabled: Story = {
  args: { children: '비활성', disabled: true },
  play: async ({ canvas }) => {
    const btn = canvas.getByRole('button', { name: /비활성/i });
    await expect(btn).toBeDisabled();
  },
};

// Polymorphic — button 대신 <a> 태그로 렌더
export const AsAnchor: Story = {
  args: { as: 'a', href: '#home', children: '홈으로 이동' },
};

// AsChild (Slot 패턴) — Button이 자식 <a>에 모든 props를 위임
export const AsChild: Story = {
  render: () => (
    <Button asChild>
      <a href="#about">소개 페이지</a>
    </Button>
  ),
};

// CssCheck — index.css의 :root { background-color: #fff }이 로드됐는지 검증
// 브라우저 기본값 transparent(rgba(0,0,0,0)) vs CSS 적용 시 rgb(255,255,255).
// color(#111)보다 기본값과 차이가 명확해 CI 헤드리스 환경에서도 안정적.
export const CssCheck: Story = {
  args: { children: 'CSS 확인' },
  play: async ({ canvasElement }) => {
    const root = canvasElement.ownerDocument.documentElement;
    await expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 255, 255)');
  },
};
