
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
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";

interface ZipcodeCharge {
  zipcode: string;
  charge: number;
}

interface GroupedZipcodes {
  [key: string]: ZipcodeCharge[];
}

export default function ZipcodeListScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [zipcodes, setZipcodes] = useState<ZipcodeCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      console.log("Checking admin session...");
      setIsCheckingAuth(true);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      console.log("Admin session value:", session);
      
      if (session !== "true") {
        console.log("No valid admin session found, redirecting to login");
        Alert.alert("Access Denied", "Please login as admin first.");
        router.replace("/(tabs)/adminLogin");
        return;
      }
      
      console.log("Admin session verified, loading zipcodes");
      setIsCheckingAuth(false);
      loadZipcodes();
    } catch (error) {
      console.error("Error checking admin session:", error);
      Alert.alert("Error", "Failed to verify admin session. Please login again.");
      router.replace("/(tabs)/adminLogin");
    }
  };

  const loadZipcodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('zipcode_charges')
        .select('zipcode, charge')
        .order('charge', { ascending: true })
        .order('zipcode', { ascending: true });

      if (error) {
        console.error("Error loading zipcodes:", error);
        Alert.alert("Error", "Failed to load zipcode data.");
        return;
      }

      setZipcodes(data || []);
      console.log(`Loaded ${data?.length || 0} zipcodes`);
    } catch (error) {
      console.error("Error loading zipcodes:", error);
      Alert.alert("Error", "An error occurred while loading zipcodes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out admin...");
      await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      console.log("Admin session removed");
      router.replace("/(tabs)/adminLogin");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

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

  // Group zipcodes by charge
  const groupedZipcodes: GroupedZipcodes = zipcodes.reduce((acc, zipcode) => {
    const charge = zipcode.charge.toString();
    if (!acc[charge]) {
      acc[charge] = [];
    }
    acc[charge].push(zipcode);
    return acc;
  }, {} as GroupedZipcodes);

  // Sort charges numerically
  const sortedCharges = Object.keys(groupedZipcodes)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push("/(tabs)/adminDashboard")}
          activeOpacity={0.8}
        >
          <IconSymbol 
            ios_icon_name="chevron.left" 
            android_material_icon_name="chevron_left" 
            size={24} 
            color={colors.primary} 
          />
          <Text style={styles.backButtonText}>Dashboard</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <IconSymbol 
            ios_icon_name="list.bullet.rectangle" 
            android_material_icon_name="list" 
            size={24} 
            color={colors.primary} 
          />
          <Text style={styles.headerTitle}>Zipcode List</Text>
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
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <IconSymbol 
              ios_icon_name="chart.bar.fill" 
              android_material_icon_name="analytics" 
              size={32} 
              color={colors.primary} 
            />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>Total Zipcodes</Text>
              <Text style={styles.summaryValue}>{zipcodes.length}</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Charge Tiers</Text>
              <Text style={styles.summaryStatValue}>{sortedCharges.length}</Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Lowest Charge</Text>
              <Text style={styles.summaryStatValue}>
                ${sortedCharges.length > 0 ? sortedCharges[0].toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatLabel}>Highest Charge</Text>
              <Text style={styles.summaryStatValue}>
                ${sortedCharges.length > 0 ? sortedCharges[sortedCharges.length - 1].toFixed(2) : '0.00'}
              </Text>
            </View>
          </View>
        </View>

        {/* Zipcode List by Charge */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading zipcodes...</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {sortedCharges.map((charge, chargeIndex) => {
              const chargeZipcodes = groupedZipcodes[charge.toString()];
              
              return (
                <View key={chargeIndex} style={styles.chargeGroup}>
                  <View style={styles.chargeHeader}>
                    <View style={styles.chargeHeaderLeft}>
                      <View style={styles.chargeBadge}>
                        <Text style={styles.chargeBadgeText}>${charge.toFixed(2)}</Text>
                      </View>
                      <Text style={styles.chargeTitle}>Charge</Text>
                    </View>
                    <View style={styles.chargeCount}>
                      <Text style={styles.chargeCountText}>
                        {chargeZipcodes.length} zipcode{chargeZipcodes.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.zipcodeGrid}>
                    {chargeZipcodes.map((zipcode, zipcodeIndex) => (
                      <View key={zipcodeIndex} style={styles.zipcodeChip}>
                        <Text style={styles.zipcodeText}>{zipcode.zipcode}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/(tabs)/zipcodeEditor")}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="pencil.circle.fill" 
              android_material_icon_name="edit" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.actionButtonText}>Edit Zipcodes</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push("/(tabs)/zipcodeAnalyzer")}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="chart.bar.fill" 
              android_material_icon_name="analytics" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.actionButtonText}>Analyze Coverage</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  listContainer: {
    gap: 20,
  },
  chargeGroup: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  chargeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chargeBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chargeBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  chargeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chargeCount: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chargeCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  zipcodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  zipcodeChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  zipcodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
