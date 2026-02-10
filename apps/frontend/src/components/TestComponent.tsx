'use client';

import React from 'react';

export default function TestComponent() {
  console.log("TestComponent rendering");
  return (
    <div style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}>
      This is a test component!
    </div>
  );
}
