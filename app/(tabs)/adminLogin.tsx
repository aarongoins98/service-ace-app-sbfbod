
import React, { useState, useEffect } from "react";
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
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/app/integrations/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_EMAIL_KEY = "admin_email";

export default function AdminLoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if already logged in
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      const adminEmail = await AsyncStorage.getItem(ADMIN_EMAIL_KEY);
      
      if (session === "true" && adminEmail) {
        console.log("Existing admin session found, verifying...");
        
        // Verify the email is still in admin_users table
        const { data, error } = await supabase
          .from('admin_users')
          .select('email, is_active')
          .eq('email', adminEmail)
          .eq('is_active', true)
          .single();

        if (data && !error) {
          console.log("Admin session verified, redirecting to dashboard");
          router.replace("/(tabs)/adminDashboard");
        } else {
          // Session invalid, clear it
          await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
          await AsyncStorage.removeItem(ADMIN_EMAIL_KEY);
        }
      }
    } catch (error) {
      console.error("Error checking existing session:", error);
    }
  };

  const handleLogin = async () => {
    console.log("=== Admin Login Attempt ===");
    
    if (!email || !email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 3) {
      Alert.alert("Invalid Password", "Please enter your admin password.");
      return;
    }

    setIsLoading(true);
    
    try {
      const emailLower = email.toLowerCase().trim();
      
      // First, check if this email is in the admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('email, is_active')
        .eq('email', emailLower)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        console.log("Email not found in admin_users table");
        Alert.alert(
          "Access Denied", 
          "This email is not authorized for admin access. Please contact your administrator."
        );
        setIsLoading(false);
        return;
      }

      console.log("Admin email verified, checking password...");

      // Check password in admin_passwords table
      const { data: passwordData, error: passwordError } = await supabase
        .from('admin_passwords')
        .select('email, password_hash, is_active')
        .eq('email', emailLower)
        .eq('is_active', true)
        .single();

      if (passwordError || !passwordData) {
        console.log("Password record not found");
        Alert.alert(
          "Login Failed", 
          "No password set for this admin account. Please contact your administrator."
        );
        setIsLoading(false);
        return;
      }

      // Simple password verification (in production, use proper bcrypt)
      if (passwordData.password_hash !== password) {
        console.log("Password mismatch");
        Alert.alert(
          "Invalid Password", 
          "The password you entered is incorrect. Please try again."
        );
        setIsLoading(false);
        return;
      }

      console.log("Password verified successfully, creating admin session...");

      // Save admin session to AsyncStorage
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, "true");
      await AsyncStorage.setItem(ADMIN_EMAIL_KEY, emailLower);
      
      // Add delay for iOS
      if (Platform.OS === 'ios') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log("Admin session saved, navigating to dashboard");
      
      Alert.alert(
        "Login Successful", 
        "Welcome to the admin dashboard!",
        [
          {
            text: "Continue",
            onPress: () => {
              setEmail("");
              setPassword("");
              router.replace("/(tabs)/adminDashboard");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error in handleLogin:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
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
              Enter your admin credentials to access the dashboard
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@yourcompany.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    ios_icon_name={showPassword ? "eye.slash.fill" : "eye.fill"} 
                    android_material_icon_name={showPassword ? "visibility_off" : "visibility"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <IconSymbol 
                ios_icon_name="lock.fill" 
                android_material_icon_name="lock" 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Logging in..." : "Login to Admin Dashboard"}
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
              Only authorized admin emails can access the admin dashboard. Contact your administrator if you need access or have forgotten your password.
            </Text>
          </View>

          <View style={styles.securityBadge}>
            <IconSymbol 
              ios_icon_name="shield.checkmark.fill" 
              android_material_icon_name="verified_user" 
              size={24} 
              color={colors.success} 
            />
            <Text style={styles.securityText}>Secured with Password Authentication</Text>
          </View>

          <View style={styles.defaultPasswordWarning}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={20} 
              color="#f59e0b" 
            />
            <Text style={styles.warningText}>
              Default password: admin123{'\n'}
              Please change this immediately after first login
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
    lineHeight: 22,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 14,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
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
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginBottom: 16,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  defaultPasswordWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 18,
  },
});
