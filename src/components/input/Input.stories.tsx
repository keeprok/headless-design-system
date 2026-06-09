import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from './Input';

const meta = {
  component: Input,
  tags: ['ai-generated', 'needs-work'],
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '320px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// label prop → <label htmlFor> 로 input과 연결
export const WithLabel: Story = {
  args: { label: '이메일', placeholder: 'example@email.com' },
  play: async ({ canvas }) => {
    // getByLabelText: label과 input이 올바르게 연결됐는지 증명
    const input = canvas.getByLabelText('이메일');
    await expect(input).toBeVisible();
  },
};

// description → aria-describedby로 input과 자동 연결
export const WithDescription: Story = {
  args: {
    label: '비밀번호',
    type: 'password',
    description: '8자 이상 입력하세요',
  },
};

// invalid=true → aria-invalid="true" 자동 설정
export const Invalid: Story = {
  args: {
    label: '이메일',
    invalid: true,
    description: '올바른 이메일 형식이 아닙니다',
  },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('이메일');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};

// 시각적 label이 없을 때 ariaLabel로 스크린 리더에 이름 제공
export const AriaLabelOnly: Story = {
  args: { ariaLabel: '검색', placeholder: '검색어 입력', type: 'search' },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('searchbox', { name: '검색' });
    await expect(input).toBeVisible();
  },
};
