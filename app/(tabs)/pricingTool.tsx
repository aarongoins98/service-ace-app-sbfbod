
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
  Image,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/app/integrations/supabase/client";

// Pricing Configuration
// You can easily update these values to adjust pricing
const PRICING_CONFIG = {
  // Square footage ranges with their base prices
  // Format: { maxSqFt: price }
  // Ranges: 0-999, 1000-1999, 2000-2999, etc.
  sqftRanges: [
    { min: 0, max: 999, price: 400 },
    { min: 1000, max: 1999, price: 450 },
    { min: 2000, max: 2999, price: 500 },
    { min: 3000, max: 3999, price: 550 },
    { min: 4000, max: 4999, price: 600 },
    { min: 5000, max: 5999, price: 650 },
    { min: 6000, max: 6999, price: 700 },
    { min: 7000, max: 7999, price: 750 },
    { min: 8000, max: 8999, price: 800 },
    { min: 9000, max: 9999, price: 850 },
    { min: 10000, max: Infinity, price: 900 },
  ],
  
  // Clean & Seal pricing ranges (for single HVAC system)
  cleanAndSealRanges: [
    { min: 0, max: 1999, price: 2500 },
    { min: 2000, max: 2999, price: 2750 },
    { min: 3000, max: 3999, price: 3000 },
    { min: 4000, max: 4999, price: 3250 },
    { min: 5000, max: 5999, price: 3500 },
    { min: 6000, max: Infinity, price: 3750 },
  ],
  
  // Clean & Seal price per HVAC system (for multiple systems)
  cleanAndSealPerHvac: 2000,
  
  // HVAC system charge per unit
  hvacSystemCharge: 300,
  
  // Partner discount percentage
  partnerDiscountPercent: 20,
};

export default function PricingToolScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [squareFootage, setSquareFootage] = useState("");
  const [hvacSystems, setHvacSystems] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [quote, setQuote] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{
    sqftCharge: number;
    hvacCharge: number;
    zipcodeCharge: number;
    subtotal: number;
    discount: number;
    total: number;
    cleanAndSealPrice: number;
  } | null>(null);
  const [zipcodeCharges, setZipcodeCharges] = useState<{ [key: string]: number }>({});
  const [isLoadingZipcodes, setIsLoadingZipcodes] = useState(true);

  useEffect(() => {
    loadZipcodeCharges();
  }, []);

  const loadZipcodeCharges = async () => {
    try {
      setIsLoadingZipcodes(true);
      const { data, error } = await supabase
        .from('zipcode_charges')
        .select('zipcode, charge');

      if (error) {
        console.error("Error loading zipcode charges:", error);
        Alert.alert("Warning", "Failed to load zipcode charges. Using default values.");
        return;
      }

      const chargesMap: { [key: string]: number } = {};
      data?.forEach(item => {
        chargesMap[item.zipcode] = item.charge;
      });
      
      setZipcodeCharges(chargesMap);
      console.log(`Loaded ${data?.length || 0} zipcode charges from database`);
    } catch (error) {
      console.error("Error loading zipcode charges:", error);
      Alert.alert("Warning", "Failed to load zipcode charges. Using default values.");
    } finally {
      setIsLoadingZipcodes(false);
    }
  };

  const getSqftCharge = (sqft: number): number => {
    const range = PRICING_CONFIG.sqftRanges.find(
      r => sqft >= r.min && sqft <= r.max
    );
    return range ? range.price : PRICING_CONFIG.sqftRanges[PRICING_CONFIG.sqftRanges.length - 1].price;
  };

  const getZipcodeCharge = (zip: string): number => {
    // Remove any spaces or dashes from zipcode
    const cleanZip = zip.replace(/[\s-]/g, '');
    return zipcodeCharges[cleanZip] ?? 0;
  };

  const getCleanAndSealPrice = (sqft: number, hvacCount: number): number => {
    // If only 1 HVAC system (0 additional), price is based on square footage
    if (hvacCount === 0) {
      const range = PRICING_CONFIG.cleanAndSealRanges.find(
        r => sqft >= r.min && sqft <= r.max
      );
      return range ? range.price : PRICING_CONFIG.cleanAndSealRanges[PRICING_CONFIG.cleanAndSealRanges.length - 1].price;
    } else {
      // Multiple HVAC systems: $2000 per system
      // hvacCount is "additional" systems, so total systems = hvacCount + 1
      const totalSystems = hvacCount + 1;
      return totalSystems * PRICING_CONFIG.cleanAndSealPerHvac;
    }
  };

  const calculateQuote = () => {
    console.log("Calculate Quote - Validating inputs");
    
    // Validate all required fields are filled
    if (!squareFootage || !hvacSystems || !zipcode) {
      console.log("Missing required fields:", { squareFootage, hvacSystems, zipcode });
      Alert.alert("Missing Information", "Please fill in all required fields (Square Footage, Additional HVAC Systems, and Zipcode) to generate a quote.");
      return;
    }

    const sqFt = parseFloat(squareFootage);
    if (isNaN(sqFt) || sqFt < 0) {
      console.log("Invalid square footage:", squareFootage);
      Alert.alert("Invalid Input", "Please enter a valid square footage (0 or greater).");
      return;
    }

    const hvacCount = parseInt(hvacSystems);
    if (isNaN(hvacCount) || hvacCount < 0) {
      console.log("Invalid HVAC count:", hvacSystems);
      Alert.alert("Invalid Input", "Please enter a valid number of additional HVAC systems (0 or greater).");
      return;
    }

    // Validate zipcode is 5 digits
    if (zipcode.length !== 5) {
      console.log("Invalid zipcode length:", zipcode);
      Alert.alert("Invalid Input", "Please enter a valid 5-digit zipcode.");
      return;
    }

    // Calculate each component
    const sqftCharge = getSqftCharge(sqFt);
    const hvacCharge = hvacCount * PRICING_CONFIG.hvacSystemCharge;
    const zipcodeCharge = getZipcodeCharge(zipcode);
    const subtotal = sqftCharge + hvacCharge + zipcodeCharge;
    
    // Calculate 20% partner discount
    const discount = subtotal * (PRICING_CONFIG.partnerDiscountPercent / 100);
    const total = subtotal - discount;

    // Calculate Clean & Seal price
    const cleanAndSealPrice = getCleanAndSealPrice(sqFt, hvacCount);

    // Set the breakdown and total
    setBreakdown({
      sqftCharge,
      hvacCharge,
      zipcodeCharge,
      subtotal,
      discount,
      total,
      cleanAndSealPrice,
    });
    setQuote(total);

    console.log('Quote calculated:', {
      squareFootage: sqFt,
      hvacSystems: hvacCount,
      zipcode,
      sqftCharge,
      hvacCharge,
      zipcodeCharge,
      subtotal,
      discount,
      total,
      cleanAndSealPrice,
    });
  };

  const resetForm = () => {
    setSquareFootage("");
    setHvacSystems("");
    setZipcode("");
    setQuote(null);
    setBreakdown(null);
  };

  const getSqftRangeText = (sqft: number): string => {
    const range = PRICING_CONFIG.sqftRanges.find(
      r => sqft >= r.min && sqft <= r.max
    );
    if (!range) return "Unknown range";
    if (range.max === Infinity) return `${range.min}+ sqft`;
    return `${range.min}-${range.max} sqft`;
  };

  const handleRequestJob = (serviceType: 'duct-cleaning' | 'clean-and-seal') => {
    console.log('Navigating to job request form with:', {
      squareFootage,
      hvacSystems,
      serviceType,
    });

    router.push({
      pathname: '/(tabs)/jobRequestForm',
      params: {
        squareFootage,
        hvacSystems,
        serviceType,
      },
    });
  };

  if (isLoadingZipcodes) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading pricing data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <IconSymbol 
            ios_icon_name="dollarsign.circle.fill" 
            android_material_icon_name="attach_money" 
            size={56} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Pricing Tool</Text>
          <Text style={styles.subtitle}>Generate accurate service quotes</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Square Footage *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter home square footage (e.g., 1500)"
              placeholderTextColor={colors.textSecondary}
              value={squareFootage}
              onChangeText={setSquareFootage}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              This square footage includes 1 HVAC system in the price
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional HVAC Systems *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of additional HVAC systems (e.g., 2)"
              placeholderTextColor={colors.textSecondary}
              value={hvacSystems}
              onChangeText={setHvacSystems}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              ${PRICING_CONFIG.hvacSystemCharge} per additional HVAC system
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zipcode *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter zipcode (e.g., 84003)"
              placeholderTextColor={colors.textSecondary}
              value={zipcode}
              onChangeText={setZipcode}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.helperText}>
              Location-based charges may apply ($0-$200)
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.calculateButton} 
            onPress={calculateQuote}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="calculator.fill" 
              android_material_icon_name="calculate" 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.calculateButtonText}>Calculate Quote</Text>
          </TouchableOpacity>

          {quote !== null && breakdown && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteLabel}>Duct Cleaning Quote</Text>
              <Text style={styles.quoteAmount}>${quote.toFixed(2)}</Text>
              
              <View style={styles.breakdownContainer}>
                <Text style={styles.breakdownTitle}>Price Breakdown</Text>
                
                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol 
                      ios_icon_name="house.fill" 
                      android_material_icon_name="home" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.breakdownLabel}>
                      Square Footage ({getSqftRangeText(parseFloat(squareFootage))})
                    </Text>
                  </View>
                  <Text style={styles.breakdownValue}>${breakdown.sqftCharge.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol 
                      ios_icon_name="fan.fill" 
                      android_material_icon_name="ac_unit" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.breakdownLabel}>
                      Additional HVAC Systems ({hvacSystems} × ${PRICING_CONFIG.hvacSystemCharge})
                    </Text>
                  </View>
                  <Text style={styles.breakdownValue}>${breakdown.hvacCharge.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol 
                      ios_icon_name="location.fill" 
                      android_material_icon_name="location_on" 
                      size={16} 
                      color={colors.textSecondary} 
                    />
                    <Text style={styles.breakdownLabel}>
                      Location Charge (Zipcode: {zipcode})
                    </Text>
                  </View>
                  <Text style={styles.breakdownValue}>${breakdown.zipcodeCharge.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownSubtotalLabel}>Subtotal</Text>
                  <Text style={styles.breakdownSubtotalValue}>${breakdown.subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownRow}>
                  <View style={styles.breakdownLeft}>
                    <IconSymbol 
                      ios_icon_name="tag.fill" 
                      android_material_icon_name="local_offer" 
                      size={16} 
                      color="#22c55e" 
                    />
                    <Text style={styles.breakdownDiscountLabel}>
                      Partner Discount ({PRICING_CONFIG.partnerDiscountPercent}%)
                    </Text>
                  </View>
                  <Text style={styles.breakdownDiscountValue}>-Great! Now let me create the admin login page and zipcode editor. I'll create the necessary files:

<write file="app/(tabs)/adminLogin.tsx">
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
    if (!password) {
      Alert.alert("Missing Information", "Please enter the admin password.");
      return;
    }

    setIsLoading(true);

    try {
      if (password === ADMIN_PASSWORD) {
        // Save admin session
        await AsyncStorage.setItem(ADMIN_SESSION_KEY, "true");
        console.log("Admin login successful");
        
        // Navigate to zipcode editor
        router.replace("/(tabs)/zipcodeEditor");
        
        // Show success message
        setTimeout(() => {
          Alert.alert("Success", "Admin login successful!");
        }, 500);
      } else {
        Alert.alert("Access Denied", "Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      Alert.alert("Error", "An error occurred during login. Please try again.");
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
            <IconSymbol 
              ios_icon_name="lock.shield.fill" 
              android_material_icon_name="admin_panel_settings" 
              size={72} 
              color={colors.primary} 
            />
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>
              Enter admin password to access zipcode management
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
              />
            </View>

            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <IconSymbol 
                ios_icon_name="arrow.right.circle.fill" 
                android_material_icon_name="login" 
                size={20} 
                color="#ffffff" 
              />
              <Text style={styles.loginButtonText}>
                {isLoading ? "Logging in..." : "Login"}
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
              Admin access is required to manage zipcode charges. Contact your system administrator if you need access.
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
    marginBottom: 32,
    marginTop: 20,
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
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
