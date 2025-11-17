
import React, { useState, useEffect } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";
const ADMIN_EMAIL_KEY = "admin_email";

interface AdminOption {
  id: string;
  title: string;
  description: string;
  route: string;
  iosIcon: string;
  androidIcon: string;
  color: string;
}

const ADMIN_OPTIONS: AdminOption[] = [
  {
    id: 'zipcodes',
    title: 'Zipcode Manager',
    description: 'Add, edit, and manage zipcode charges',
    route: '/(tabs)/zipcodeEditor',
    iosIcon: 'map.fill',
    androidIcon: 'map',
    color: '#3b82f6',
  },
  {
    id: 'companies',
    title: 'Company Manager',
    description: 'Manage company list for job requests',
    route: '/(tabs)/companyEditor',
    iosIcon: 'building.2.fill',
    androidIcon: 'business',
    color: '#8b5cf6',
  },
  {
    id: 'prices',
    title: 'Price Editor',
    description: 'Edit duct cleaning and seal service prices',
    route: '/(tabs)/priceEditor',
    iosIcon: 'dollarsign.circle.fill',
    androidIcon: 'attach_money',
    color: '#10b981',
  },
  {
    id: 'analyzer',
    title: 'Zipcode Analyzer',
    description: 'Analyze zipcode coverage by county',
    route: '/(tabs)/zipcodeAnalyzer',
    iosIcon: 'chart.bar.fill',
    androidIcon: 'analytics',
    color: '#f59e0b',
  },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      console.log("=== Admin Dashboard: Checking Session ===");
      setIsCheckingAuth(true);
      
      // Add a delay to ensure AsyncStorage is ready, especially on iOS
      if (Platform.OS === 'ios') {
        console.log("iOS detected, adding delay before session check...");
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      const email = await AsyncStorage.getItem(ADMIN_EMAIL_KEY);
      
      console.log("Admin session value retrieved:", session);
      console.log("Admin email retrieved:", email);
      
      if (session !== "true" || !email) {
        console.log("No valid admin session found, redirecting to login");
        Alert.alert("Access Denied", "Please login as admin first.");
        router.replace("/(tabs)/adminLogin");
        return;
      }

      // Verify the email is still in admin_users table and is active
      const { data, error } = await supabase
        .from('admin_users')
        .select('email, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log("Admin email not found or inactive in database");
        Alert.alert(
          "Access Revoked", 
          "Your admin access has been revoked. Please contact your administrator."
        );
        await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
        await AsyncStorage.removeItem(ADMIN_EMAIL_KEY);
        router.replace("/(tabs)/adminLogin");
        return;
      }
      
      console.log("Admin session verified successfully");
      setAdminEmail(email);
      setIsCheckingAuth(false);
    } catch (error) {
      console.error("=== Admin Dashboard: Session Check Error ===");
      console.error("Error details:", error);
      Alert.alert("Error", "Failed to verify admin session. Please login again.");
      router.replace("/(tabs)/adminLogin");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout from admin?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("=== Admin Logout ===");
              console.log("Removing admin session...");
              
              // Sign out from Supabase Auth
              await supabase.auth.signOut();
              
              // Clear AsyncStorage
              await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
              await AsyncStorage.removeItem(ADMIN_EMAIL_KEY);
              console.log("Admin session removed successfully");
              
              // Add a small delay to ensure removal completes
              await new Promise(resolve => setTimeout(resolve, 100));
              
              router.replace("/(tabs)/adminLogin");
            } catch (error) {
              console.error("=== Admin Logout Error ===");
              console.error("Error details:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleNavigate = (route: string) => {
    console.log("Navigating to:", route);
    router.push(route as any);
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying admin access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <IconSymbol 
            ios_icon_name="shield.fill" 
            android_material_icon_name="admin_panel_settings" 
            size={28} 
            color={colors.primary} 
          />
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            {adminEmail && (
              <Text style={styles.headerSubtitle}>{adminEmail}</Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <IconSymbol 
            ios_icon_name="rectangle.portrait.and.arrow.right" 
            android_material_icon_name="logout" 
            size={20} 
            color={colors.error} 
          />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeCard}>
          <Image 
            source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeTitle}>Welcome to Admin Tools</Text>
          <Text style={styles.welcomeDescription}>
            Manage your pricing, zipcodes, companies, and analyze coverage from one central location.
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {ADMIN_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleNavigate(option.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                <IconSymbol 
                  ios_icon_name={option.iosIcon} 
                  android_material_icon_name={option.androidIcon} 
                  size={32} 
                  color="#ffffff" 
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <IconSymbol 
                  ios_icon_name="chevron.right" 
                  android_material_icon_name="chevron_right" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={24} 
            color={colors.primary} 
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Quick Tips</Text>
            <Text style={styles.infoText}>
              - Use Zipcode Manager to add or update service area charges{'\n'}
              - Company Manager controls the dropdown in job request forms{'\n'}
              - Price Editor updates base pricing for all quotes{'\n'}
              - Zipcode Analyzer helps identify coverage gaps
            </Text>
          </View>
        </View>

        <View style={styles.securityInfo}>
          <IconSymbol 
            ios_icon_name="lock.shield.fill" 
            android_material_icon_name="security" 
            size={20} 
            color={colors.success} 
          />
          <Text style={styles.securityText}>
            Your session is secured with email verification
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  welcomeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  arrowContainer: {
    padding: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
  },
  securityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
});
