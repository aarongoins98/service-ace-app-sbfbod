
import React, { useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_PASSWORD = "Refresht1m3!";
const ADMIN_SESSION_KEY = "admin_session";

export default function AdminLoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log("=== Admin Login Started ===");
    console.log("Password entered:", password ? "***" : "(empty)");
    
    if (!password) {
      Alert.alert("Missing Information", "Please enter the admin password.");
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      console.log("Password incorrect");
      Alert.alert("Access Denied", "Incorrect password. Please try again.");
      setPassword("");
      return;
    }

    console.log("Password correct, proceeding with login...");
    setIsLoading(true);
    
    try {
      // Clear any existing session first
      console.log("Clearing any existing session...");
      await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      
      // Add a small delay to ensure the removal completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Save new admin session
      console.log("Saving new admin session...");
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, "true");
      console.log("Admin session saved to AsyncStorage");
      
      // Add a longer delay for iOS to ensure AsyncStorage write completes
      if (Platform.OS === 'ios') {
        console.log("iOS detected, adding extra delay...");
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Verify the session was saved
      const verifySession = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      console.log("Verified admin session value:", verifySession);
      
      if (verifySession === "true") {
        console.log("Session verified successfully!");
        console.log("Navigating to admin dashboard...");
        
        // Reset form state before navigation
        setPassword("");
        setIsLoading(false);
        
        // Use push instead of replace to ensure proper navigation
        router.push("/(tabs)/adminDashboard");
        
        console.log("Navigation command sent");
      } else {
        console.error("Session verification failed - value:", verifySession);
        throw new Error("Session verification failed");
      }
    } catch (error) {
      console.error("=== Admin Login Error ===");
      console.error("Error details:", error);
      Alert.alert(
        "Login Error", 
        "Failed to save admin session. Please try again.\n\nError: " + (error instanceof Error ? error.message : String(error))
      );
      setPassword("");
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image 
              source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>
              Enter admin password to access management tools
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter admin password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleLogin}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Logging in..." : "Admin Login"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.secondary} 
            />
            <Text style={styles.infoText}>
              Admin access is required to manage zipcodes, companies, and pricing for the services.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
