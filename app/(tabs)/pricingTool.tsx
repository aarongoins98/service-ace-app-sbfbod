
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
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";

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
  
  // HVAC system charge per unit
  hvacSystemCharge: 300,
  
  // Zipcode charges
  // Add or modify zipcodes and their associated charges here
  zipcodeCharges: {
    // Example zipcodes - replace with your actual zipcodes
    // $0 charge zipcodes
    '10001': 0,
    '10002': 0,
    '10003': 0,
    
    // $50 charge zipcodes
    '20001': 50,
    '20002': 50,
    '20003': 50,
    
    // $100 charge zipcodes
    '30001': 100,
    '30002': 100,
    '30003': 100,
    
    // $150 charge zipcodes
    '40001': 150,
    '40002': 150,
    '40003': 150,
    
    // $200 charge zipcodes
    '50001': 200,
    '50002': 200,
    '50003': 200,
  } as { [key: string]: number },
};

export default function PricingToolScreen() {
  const theme = useTheme();
  
  const [squareFootage, setSquareFootage] = useState("");
  const [hvacSystems, setHvacSystems] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [quote, setQuote] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{
    sqftCharge: number;
    hvacCharge: number;
    zipcodeCharge: number;
    total: number;
  } | null>(null);

  const getSqftCharge = (sqft: number): number => {
    const range = PRICING_CONFIG.sqftRanges.find(
      r => sqft >= r.min && sqft <= r.max
    );
    return range ? range.price : PRICING_CONFIG.sqftRanges[PRICING_CONFIG.sqftRanges.length - 1].price;
  };

  const getZipcodeCharge = (zip: string): number => {
    // Remove any spaces or dashes from zipcode
    const cleanZip = zip.replace(/[\s-]/g, '');
    return PRICING_CONFIG.zipcodeCharges[cleanZip] ?? 0;
  };

  const calculateQuote = () => {
    // Validate inputs
    if (!squareFootage || !hvacSystems || !zipcode) {
      Alert.alert("Missing Information", "Please fill in all fields to generate a quote.");
      return;
    }

    const sqFt = parseFloat(squareFootage);
    if (isNaN(sqFt) || sqFt < 0) {
      Alert.alert("Invalid Input", "Please enter a valid square footage (0 or greater).");
      return;
    }

    const hvacCount = parseInt(hvacSystems);
    if (isNaN(hvacCount) || hvacCount < 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of HVAC systems (0 or greater).");
      return;
    }

    // Calculate each component
    const sqftCharge = getSqftCharge(sqFt);
    const hvacCharge = hvacCount * PRICING_CONFIG.hvacSystemCharge;
    const zipcodeCharge = getZipcodeCharge(zipcode);
    const total = sqftCharge + hvacCharge + zipcodeCharge;

    // Set the breakdown and total
    setBreakdown({
      sqftCharge,
      hvacCharge,
      zipcodeCharge,
      total,
    });
    setQuote(total);

    console.log('Quote calculated:', {
      squareFootage: sqFt,
      hvacSystems: hvacCount,
      zipcode,
      sqftCharge,
      hvacCharge,
      zipcodeCharge,
      total,
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
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
            <Text style={styles.label}>Square Footage</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter home square footage (e.g., 1500)"
              placeholderTextColor={colors.textSecondary}
              value={squareFootage}
              onChangeText={setSquareFootage}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Ranges start at 0-999 sqft
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of HVAC Systems</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of HVAC systems (e.g., 2)"
              placeholderTextColor={colors.textSecondary}
              value={hvacSystems}
              onChangeText={setHvacSystems}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              ${PRICING_CONFIG.hvacSystemCharge} per HVAC system
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zipcode</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter zipcode (e.g., 10001)"
              placeholderTextColor={colors.textSecondary}
              value={zipcode}
              onChangeText={setZipcode}
              keyboardType="numeric"
              maxLength={5}
            />
            <Text style={styles.helperText}>
              Location-based charges may apply
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
              <Text style={styles.quoteLabel}>Estimated Quote</Text>
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
                      HVAC Systems ({hvacSystems} × ${PRICING_CONFIG.hvacSystemCharge})
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
                  <Text style={styles.breakdownTotalLabel}>Total</Text>
                  <Text style={styles.breakdownTotalValue}>${breakdown.total.toFixed(2)}</Text>
                </View>
              </View>

              <Text style={styles.quoteNote}>
                This is an estimated quote based on the provided information
              </Text>
              
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>Reset Form</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.primary} 
          />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              Pricing is calculated based on:
            </Text>
            <Text style={styles.infoText}>
              - Square footage range (starting at $400)
            </Text>
            <Text style={styles.infoText}>
              - Number of HVAC systems ($300 each)
            </Text>
            <Text style={styles.infoText}>
              - Location-based zipcode charges
            </Text>
          </View>
        </View>

        <View style={styles.configNote}>
          <Text style={styles.configNoteText}>
            Note: To update zipcode charges or square footage pricing, modify the PRICING_CONFIG at the top of the pricingTool.tsx file.
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
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  calculateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quoteAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 20,
  },
  breakdownContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  breakdownTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  quoteNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 14,
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
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  configNote: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  configNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
