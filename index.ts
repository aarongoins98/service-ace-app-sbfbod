
import 'expo-router/entry';
import { Platform } from 'react-native';

// Set up global error handlers
if (Platform.OS !== 'web') {
  // Handle unhandled promise rejections
  const originalHandler = global.Promise.prototype.catch;
  
  // Log unhandled rejections
  if (typeof ErrorUtils !== 'undefined') {
    const originalGlobalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('Global error handler:', error, 'isFatal:', isFatal);
      
      // Call the original handler
      if (originalGlobalHandler) {
        originalGlobalHandler(error, isFatal);
      }
    });
  }
}

// Handle unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalUnhandledRejection = global.onunhandledrejection;
  
  global.onunhandledrejection = (event: any) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (originalUnhandledRejection) {
      originalUnhandledRejection(event);
    }
  };
}

console.log('App entry point loaded successfully');
