import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import React, { useState } from 'react';
import {
  SelectRoot,
  SelectTrigger,
  SelectPortal,
  SelectOverlay,
  SelectContent,
  SelectOption,
} from './select';

const optionStyle: React.CSSProperties = {
  padding: '10px 16px',
  cursor: 'pointer',
  listStyle: 'none',
  borderBottom: '1px solid #eee',
};

const contentStyle: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: '#fff',
  border: '1px solid #ccc',
  padding: '8px',
  zIndex: 50,
  listStyle: 'none',
  margin: 0,
  minWidth: '150px',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 40,
};

const triggerStyle: React.CSSProperties = {
  padding: '8px 16px',
  cursor: 'pointer',
  border: '1px solid #ccc',
};

function PetSelect() {
  return (
    <SelectRoot defaultValue="강아지">
      <SelectTrigger style={triggerStyle} />
      <SelectPortal>
        <SelectOverlay style={overlayStyle} />
        <SelectContent style={contentStyle}>
          <SelectOption value="강아지" style={optionStyle}>강아지</SelectOption>
          <SelectOption value="고양이" style={optionStyle}>고양이</SelectOption>
          <SelectOption value="거북이" style={optionStyle}>거북이</SelectOption>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  );
}

function FruitSelect() {
  const [value, setValue] = useState('사과');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
      <p style={{ margin: 0 }}>
        선택된 값: <strong data-testid="selected-value">{value}</strong>
      </p>
      <SelectRoot value={value} onChange={setValue}>
        <SelectTrigger style={{ ...triggerStyle, border: '2px solid red' }} />
        <SelectPortal>
          <SelectOverlay style={overlayStyle} />
          <SelectContent style={contentStyle}>
            <SelectOption value="사과" style={optionStyle}>사과</SelectOption>
            <SelectOption value="바나나" style={optionStyle}>바나나</SelectOption>
            <SelectOption value="포도" style={optionStyle}>포도</SelectOption>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>
  );
}

const meta = {
  component: SelectRoot,
  tags: ['ai-generated', 'needs-work'],
  decorators: [
    (Story) => (
      <div style={{ padding: '40px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

// 비제어 모드 — 트리거 클릭 시 listbox 열림 + aria-expanded 변화 검증
export const Uncontrolled: Story = {
  args: { children: null },
  render: () => <PetSelect />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    const trigger = canvas.getByRole('button');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('listbox')).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

// 제어 모드 — 옵션 클릭 시 부모 state 반영 검증
export const Controlled: Story = {
  args: { children: null },
  render: () => <FruitSelect />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button'));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole('option', { name: '바나나' }));
    // 선택 후 listbox가 닫히고 부모 state('바나나')가 표시됨
    await expect(body.queryByRole('listbox')).toBeNull();
    await expect(canvas.getByTestId('selected-value')).toHaveTextContent('바나나');
  },
};

// 키보드 네비게이션 — ArrowDown으로 탐색, Escape로 닫기
export const KeyboardNavigation: Story = {
  args: { children: null },
  render: () => <PetSelect />,
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button'));
    const body = within(canvasElement.ownerDocument.body);
    await expect(await body.findByRole('listbox')).toBeVisible();
    // ArrowDown으로 포커스 이동
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    // Escape로 닫기
    await userEvent.keyboard('{Escape}');
    await expect(body.queryByRole('listbox')).toBeNull();
  },
};
