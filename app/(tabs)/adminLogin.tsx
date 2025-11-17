
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
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Check if already logged in
    checkExistingSession();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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

  const handleSendOTP = async () => {
    console.log("=== Sending OTP ===");
    
    if (!email || !email.includes('@')) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    
    try {
      // First, check if this email is in the admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('email, is_active')
        .eq('email', email.toLowerCase().trim())
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

      console.log("Admin email verified, sending OTP...");

      // Send OTP via Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false, // Don't create new users
        }
      });

      if (error) {
        console.error("Error sending OTP:", error);
        Alert.alert("Error", `Failed to send OTP: ${error.message}`);
        setIsLoading(false);
        return;
      }

      console.log("OTP sent successfully");
      setOtpSent(true);
      setCountdown(60); // 60 second cooldown
      Alert.alert(
        "OTP Sent", 
        `A one-time password has been sent to ${email}. Please check your email and enter the code below.`
      );
    } catch (error) {
      console.error("Error in handleSendOTP:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    console.log("=== Verifying OTP ===");
    
    if (!otp || otp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code from your email.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: otp,
        type: 'email'
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        Alert.alert("Invalid Code", "The code you entered is incorrect or has expired. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        Alert.alert("Error", "Failed to create session. Please try again.");
        setIsLoading(false);
        return;
      }

      console.log("OTP verified successfully, creating admin session...");

      // Save admin session to AsyncStorage
      await AsyncStorage.setItem(ADMIN_SESSION_KEY, "true");
      await AsyncStorage.setItem(ADMIN_EMAIL_KEY, email.toLowerCase().trim());
      
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
              setOtp("");
              setOtpSent(false);
              router.replace("/(tabs)/adminDashboard");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error in handleVerifyOTP:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = () => {
    if (countdown > 0) {
      Alert.alert("Please Wait", `You can resend the code in ${countdown} seconds.`);
      return;
    }
    setOtp("");
    handleSendOTP();
  };

  const handleBackToEmail = () => {
    setOtpSent(false);
    setOtp("");
    setCountdown(0);
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
              {otpSent 
                ? "Enter the 6-digit code sent to your email"
                : "Enter your admin email to receive a one-time password"
              }
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!otpSent ? (
              <>
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

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleSendOTP}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <IconSymbol 
                    ios_icon_name="envelope.fill" 
                    android_material_icon_name="email" 
                    size={20} 
                    color="#ffffff" 
                  />
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? "Sending..." : "Send One-Time Password"}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.emailDisplay}>
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill" 
                    android_material_icon_name="check_circle" 
                    size={20} 
                    color={colors.success} 
                  />
                  <Text style={styles.emailDisplayText}>{email}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>One-Time Password *</Text>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="000000"
                    placeholderTextColor={colors.textSecondary}
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]} 
                  onPress={handleVerifyOTP}
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
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.otpActions}>
                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleResendOTP}
                    disabled={countdown > 0}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.secondaryButtonText, countdown > 0 && styles.disabledText]}>
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={handleBackToEmail}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Change Email</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.infoBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.secondary} 
            />
            <Text style={styles.infoText}>
              {otpSent 
                ? "The code is valid for 60 minutes. Check your spam folder if you don't see the email."
                : "Only authorized admin emails can access the admin dashboard. Contact your administrator if you need access."
              }
            </Text>
          </View>

          <View style={styles.securityBadge}>
            <IconSymbol 
              ios_icon_name="shield.checkmark.fill" 
              android_material_icon_name="verified_user" 
              size={24} 
              color={colors.success} 
            />
            <Text style={styles.securityText}>Secured with Email Verification</Text>
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
  otpInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 8,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  emailDisplayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledText: {
    color: colors.textSecondary,
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
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
});
