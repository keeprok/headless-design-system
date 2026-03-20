'use client';

import React, { useState } from 'react';
import { SelectRoot, SelectTrigger, SelectPortal, SelectOverlay, SelectContent, SelectOption } from '@/components/select/select';

export default function SelectDemo() {
  const [controlledValue, setControlledValue] = useState<string>('사과');

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h2>1. 비제어 모드 (Uncontrolled)</h2>
      <SelectRoot defaultValue="강아지">
        <SelectTrigger style={{ padding: '10px 20px', border: '2px solid #ccc', cursor: 'pointer' }} />

        <SelectPortal>
          {/* 빨간색 반투명 방어막 강제 적용 */}
          <SelectOverlay
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              zIndex: 40,
            }}
          />

          {/* 하얀색 모달창 강제 중앙 정렬 */}
          <SelectContent
            style={{
              position: 'fixed',
              top: '50%',
              left: '30%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              border: '1px solid black',
              padding: '10px',
              zIndex: 50,
              listStyle: 'none',
              margin: 0,
              minWidth: '150px',
            }}
          >
            <SelectOption value="강아지" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
              강아지
            </SelectOption>
            <SelectOption value="고양이" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
              고양이
            </SelectOption>
            <SelectOption value="거북이" style={{ padding: '10px', cursor: 'pointer' }}>
              거북이
            </SelectOption>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>

      <hr style={{ margin: '40px 0' }} />

      <h2>2. 제어 모드 (Controlled)</h2>
      <p>
        부모가 쥐고 있는 현재 값: <strong style={{ color: 'red' }}>{controlledValue}</strong>
      </p>

      <SelectRoot value={controlledValue} onChange={setControlledValue}>
        <SelectTrigger style={{ padding: '10px 20px', border: '2px solid red', cursor: 'pointer' }} />

        <SelectPortal>
          <SelectOverlay
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
          />

          <SelectContent
            style={{
              position: 'fixed',
              top: '50%',
              left: '70%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              border: '1px solid black',
              padding: '10px',
              zIndex: 50,
              listStyle: 'none',
              margin: 0,
              minWidth: '150px',
            }}
          >
            <SelectOption value="사과" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
              사과
            </SelectOption>
            <SelectOption value="바나나" style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
              바나나
            </SelectOption>
            <SelectOption value="포도" style={{ padding: '10px', cursor: 'pointer' }}>
              포도
            </SelectOption>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>
  );
}
