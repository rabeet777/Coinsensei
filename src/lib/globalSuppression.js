// Global suppression for Next.js 15+ and Supabase cookies warnings
// This runs before any other code to ensure warnings are suppressed from the start

(function() {
  if (typeof console !== 'undefined' && console.error) {
    const originalConsoleError = console.error;
    
    console.error = function(...args) {
      const message = args.join(' ');
      
      // Suppress specific Supabase + Next.js 15+ warnings
      if (
        message.includes('cookies().get') ||
        message.includes('should be awaited') ||
        message.includes('sb-gmjqbhjsdmmpolocpgbs-auth-token') ||
        message.includes('sync-dynamic-apis') ||
        (message.includes('Route "') && message.includes('used `cookies()'))
      ) {
        // Silently return - suppress these warnings
        return;
      }
      
      // Allow all other errors through
      return originalConsoleError.apply(this, args);
    };
  }
})(); 