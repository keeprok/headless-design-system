// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(// 빌드 결과물과 설정 파일은 검사 제외
{
  ignores: [
    'dist',
    'vite.config.ts',
    // 학습용 레퍼런스 파일 — 프로덕션 컴포넌트가 아니므로 lint 제외
    'src/components/dialog/Dialog_Reference.tsx',
  ],
}, {
  files: ['**/*.{ts,tsx}'],

  extends: [
    // JS 기본 권장 규칙
    js.configs.recommended,
    // TypeScript 엄격 타입 검사 규칙
    ...tseslint.configs.recommended,
    // 접근성 규칙 (aria-*, role, tabIndex, 키보드 이벤트 등)
    jsxA11y.flatConfigs.recommended,
    // React Hooks 규칙 (의존성 배열, 훅 호출 순서 등)
    reactHooks.configs.flat['recommended-latest'],
  ],

  languageOptions: {
    globals: {
      // 브라우저 전역 객체 허용 (document, window 등)
      ...globals.browser,
    },
  },

  rules: {
    // ── TypeScript ──────────────────────────────────────────
    // any 타입 명시적 사용 금지 (타입 안전성 보장)
    '@typescript-eslint/no-explicit-any': 'error',
    // 선언만 하고 쓰지 않는 변수 금지 (_로 시작하면 예외)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // ── 접근성 (jsx-a11y) ────────────────────────────────────
    // 클릭 이벤트가 있는 비대화형 요소에 키보드 이벤트도 요구
    // (헤드리스 컴포넌트에서 onClick만 붙이는 실수 방지)
    'jsx-a11y/click-events-have-key-events': 'error',
    // 비대화형 요소(div, span 등)에 마우스 이벤트만 붙이는 것 금지
    'jsx-a11y/no-noninteractive-element-interactions': 'warn',
    // role="option" 등 대화형 역할을 가진 요소는 포커스 가능해야 함
    'jsx-a11y/interactive-supports-focus': 'error',

    // ── React Hooks ──────────────────────────────────────────
    // Slot(asChild) 패턴에서 cloneElement로 ref를 전달하는 것은 정상 패턴.
    // Radix UI 등 주요 라이브러리와 동일한 구현 방식이므로 warn으로 완화.
    'react-hooks/refs': 'warn',
  },
}, storybook.configs["flat/recommended"]);
