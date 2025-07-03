// Runtime warning suppression for Next.js 15+ and Supabase auth helpers compatibility
// This suppresses the harmless but annoying cookies warnings until Supabase updates their helpers

const originalConsoleError = console.error;

export function suppressCookiesWarnings() {
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Skip specific cookies warnings that don't affect functionality
    if (
      (message.includes('cookies().get') && message.includes('should be awaited')) ||
      (message.includes('Route "') && message.includes('used `cookies()') && message.includes('sync-dynamic-apis')) ||
      message.includes('sb-gmjqbhjsdmmpolocpgbs-auth-token')
    ) {
      return; // Suppress this warning
    }
    
    // Allow all other console.error messages through
    originalConsoleError.apply(console, args);
  };
}

export function restoreConsoleError() {
  console.error = originalConsoleError;
}

// Auto-suppress on import in development
if (process.env.NODE_ENV === 'development') {
  suppressCookiesWarnings();
} 