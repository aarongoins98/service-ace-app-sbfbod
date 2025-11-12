
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

let ExtensionStorage: any = null;
let storage: any = null;

// Only import and initialize on iOS
if (Platform.OS === 'ios') {
  try {
    const AppleTargets = require("@bacons/apple-targets");
    ExtensionStorage = AppleTargets.ExtensionStorage;
    
    // Initialize storage with your group ID
    // Note: This requires proper configuration in app.json
    try {
      storage = new ExtensionStorage("group.com.natively.app");
      console.log('Widget storage initialized successfully');
    } catch (storageError) {
      console.warn('Failed to initialize widget storage:', storageError);
      storage = null;
    }
  } catch (importError) {
    console.warn('Failed to import @bacons/apple-targets:', importError);
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  // Update widget state whenever what we want to show changes
  React.useEffect(() => {
    if (Platform.OS === 'ios' && storage && ExtensionStorage) {
      try {
        // set widget_state to null if we want to reset the widget
        // storage.set("widget_state", null);

        // Refresh widget
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.warn('Failed to reload widget:', error);
      }
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS === 'ios' && ExtensionStorage) {
      try {
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.warn('Failed to refresh widget:', error);
      }
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
