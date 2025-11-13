
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
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";

interface ServicePrice {
  id: string;
  service_name: string;
  price: number;
  description: string;
}

export default function PriceEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [prices, setPrices] = useState<ServicePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    try {
      console.log("Checking admin session...");
      setIsCheckingAuth(true);
      
      // Add a small delay to ensure AsyncStorage is ready on iOS
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      console.log("Admin session value:", session);
      
      if (session !== "true") {
        console.log("No valid admin session found, redirecting to login");
        Alert.alert("Access Denied", "Please login as admin first.");
        router.replace("/(tabs)/adminLogin");
        return;
      }
      
      console.log("Admin session verified, loading prices");
      setIsCheckingAuth(false);
      loadPrices();
    } catch (error) {
      console.error("Error checking admin session:", error);
      Alert.alert("Error", "Failed to verify admin session. Please login again.");
      router.replace("/(tabs)/adminLogin");
    }
  };

  const loadPrices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .order('service_name', { ascending: true });

      if (error) {
        console.error("Error loading prices:", error);
        Alert.alert("Error", "Failed to load pricing data.");
        return;
      }

      setPrices(data || []);
      console.log(`Loaded ${data?.length || 0} service prices`);
    } catch (error) {
      console.error("Error loading prices:", error);
      Alert.alert("Error", "An error occurred while loading prices.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async (id: string, serviceName: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert("Invalid Price", "Price must be a positive number.");
      return;
    }

    try {
      const { error } = await supabase
        .from('service_prices')
        .update({ price, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error("Error updating price:", error);
        Alert.alert("Error", "Failed to update price.");
        return;
      }

      console.log("Price updated successfully");
      setEditingId(null);
      setEditPrice("");
      loadPrices();
      Alert.alert("Success", `${getDisplayName(serviceName)} updated successfully!`);
    } catch (error) {
      console.error("Error updating price:", error);
      Alert.alert("Error", "An error occurred while updating price.");
    }
  };

  const getDisplayName = (serviceName: string): string => {
    const names: { [key: string]: string } = {
      'duct_cleaning_base': 'Duct Cleaning Base Price',
      'duct_clean_seal_base': 'Duct Clean & Seal Base Price',
      'duct_clean_seal_per_hvac': 'Clean & Seal Per HVAC System',
      'hvac_system_charge': 'Additional HVAC System Charge',
      'partner_discount_percent': 'Partner Discount Percentage',
    };
    return names[serviceName] || serviceName;
  };

  const getIcon = (serviceName: string): { ios: string; android: string } => {
    const icons: { [key: string]: { ios: string; android: string } } = {
      'duct_cleaning_base': { ios: 'wind', android: 'air' },
      'duct_clean_seal_base': { ios: 'sparkles', android: 'auto_awesome' },
      'duct_clean_seal_per_hvac': { ios: 'fan.fill', android: 'ac_unit' },
      'hvac_system_charge': { ios: 'plus.circle.fill', android: 'add_circle' },
      'partner_discount_percent': { ios: 'tag.fill', android: 'local_offer' },
    };
    return icons[serviceName] || { ios: 'dollarsign.circle', android: 'attach_money' };
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
              ios_icon_name="dollarsign.circle.fill" 
              android_material_icon_name="attach_money" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.headerTitle}>Price Manager</Text>
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Info Section */}
          <View style={styles.infoCard}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={24} 
              color={colors.primary} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Service Pricing Configuration</Text>
              <Text style={styles.infoText}>
                Update the base prices for duct cleaning and duct clean & seal services. These prices are used in the Pricing Tool to generate customer quotes.
              </Text>
            </View>
          </View>

          {/* Price List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading prices...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {prices.map((priceItem) => {
                const icon = getIcon(priceItem.service_name);
                const isPercent = priceItem.service_name.includes('percent');
                
                return (
                  <View key={priceItem.id} style={styles.priceCard}>
                    <View style={styles.priceHeader}>
                      <View style={styles.priceIconContainer}>
                        <IconSymbol 
                          ios_icon_name={icon.ios} 
                          android_material_icon_name={icon.android} 
                          size={24} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.priceInfo}>
                        <Text style={styles.priceName}>
                          {getDisplayName(priceItem.service_name)}
                        </Text>
                        <Text style={styles.priceDescription}>
                          {priceItem.description}
                        </Text>
                      </View>
                    </View>

                    {editingId === priceItem.id ? (
                      <View style={styles.editForm}>
                        <View style={styles.editInputContainer}>
                          <Text style={styles.currencySymbol}>
                            {isPercent ? '' : '$'}
                          </Text>
                          <TextInput
                            style={styles.editInput}
                            value={editPrice}
                            onChangeText={setEditPrice}
                            keyboardType="numeric"
                            autoFocus
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                          />
                          <Text style={styles.percentSymbol}>
                            {isPercent ? '%' : ''}
                          </Text>
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity 
                            style={styles.saveButton}
                            onPress={() => handleUpdatePrice(priceItem.id, priceItem.service_name)}
                            activeOpacity={0.8}
                          >
                            <IconSymbol 
                              ios_icon_name="checkmark.circle.fill" 
                              android_material_icon_name="check_circle" 
                              size={28} 
                              color="#22c55e" 
                            />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => {
                              setEditingId(null);
                              setEditPrice("");
                            }}
                            activeOpacity={0.8}
                          >
                            <IconSymbol 
                              ios_icon_name="xmark.circle.fill" 
                              android_material_icon_name="cancel" 
                              size={28} 
                              color={colors.textSecondary} 
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.priceRow}>
                        <View style={styles.priceValueContainer}>
                          <Text style={styles.priceValue}>
                            {isPercent ? `${priceItem.price}%` : `$${priceItem.price.toFixed(2)}`}
                          </Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => {
                            setEditingId(priceItem.id);
                            setEditPrice(priceItem.price.toString());
                          }}
                          activeOpacity={0.8}
                        >
                          <IconSymbol 
                            ios_icon_name="pencil.circle.fill" 
                            android_material_icon_name="edit" 
                            size={28} 
                            color={colors.primary} 
                          />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Warning Section */}
          <View style={styles.warningCard}>
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={24} 
              color="#f59e0b" 
            />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Important Note</Text>
              <Text style={styles.warningText}>
                Changes to these prices will immediately affect all new quotes generated by the Pricing Tool. Make sure to communicate any price changes to your team.
              </Text>
            </View>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
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
    lineHeight: 18,
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
    gap: 16,
  },
  priceCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  priceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  priceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  priceDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceValueContainer: {
    flex: 1,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  editForm: {
    gap: 16,
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginRight: 8,
  },
  editInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  percentSymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  saveButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 4,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    gap: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
