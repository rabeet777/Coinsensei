// src/components/ui/toaster.tsx
'use client';

import { useEffect } from 'react';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  useEffect(() => {
    // Any initialization logic can go here
  }, []);

  return (
    <Sonner
      position="top-right"
      closeButton={true}
      richColors={true}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
        },
      }}
    />
  );
}
