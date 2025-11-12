
import React, { useState, useRef } from "react";
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
  findNodeHandle,
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
  
  // Zipcode charges
  // Add or modify zipcodes and their associated charges here
  zipcodeCharges: {
    // $0 charge zipcodes
    '84003': 0,
    '84004': 0,
    '84005': 0,
    '84009': 0,
    '84020': 0,
    '84042': 0,
    '84043': 0,
    '84045': 0,
    '84047': 0,
    '84057': 0,
    '84058': 0,
    '84059': 0,
    '84062': 0,
    '84065': 0,
    '84070': 0,
    '84084': 0,
    '84088': 0,
    '84093': 0,
    '84094': 0,
    '84095': 0,
    '84097': 0,
    '84601': 0,
    '84606': 0,
    '84660': 0,
    
    // $50 charge zipcodes
    '84006': 50,
    '84013': 50,
    '84044': 50,
    '84081': 50,
    '84101': 50,
    '84102': 50,
    '84103': 50,
    '84104': 50,
    '84105': 50,
    '84106': 50,
    '84107': 50,
    '84108': 50,
    '84109': 50,
    '84111': 50,
    '84112': 50,
    '84113': 50,
    '84115': 50,
    '84116': 50,
    '84117': 50,
    '84118': 50,
    '84119': 50,
    '84120': 50,
    '84121': 50,
    '84122': 50,
    '84123': 50,
    '84124': 50,
    '84128': 50,
    '84129': 50,
    '84150': 50,
    '84626': 50,
    '84633': 50,
    '84651': 50,
    '84653': 50,
    '84655': 50,
    
    // $100 charge zipcodes
    '84010': 100,
    '84014': 100,
    '84025': 100,
    '84037': 100,
    '84040': 100,
    '84041': 100,
    '84049': 100,
    '84054': 100,
    '84087': 100,
    '84645': 100,
    
    // $150 charge zipcodes
    '84015': 150,
    '84056': 150,
    '84060': 150,
    '84061': 150,
    '84067': 150,
    '84074': 150,
    '84075': 150,
    '84082': 150,
    '84098': 150,
    '84315': 150,
    '84401': 150,
    '84403': 150,
    '84404': 150,
    '84405': 150,
    '84414': 150,
    '84628': 150,
    '84629': 150,
    '84632': 150,
    '84648': 150,
    
    // $200 charge zipcodes
    '84017': 200,
    '84029': 200,
    '84036': 200,
    '84050': 200,
    '84071': 200,
    '84302': 200,
    '84310': 200,
    '84317': 200,
    '84324': 200,
    '84340': 200,
    '84526': 200,
    '84627': 200,
    '84639': 200,
    '84646': 200,
    '84647': 200,
    '84662': 200,
  } as { [key: string]: number },
};

// Additional padding to ensure field is fully visible
const SCROLL_PADDING = 20;

export default function PricingToolScreen() {
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  
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

  const scrollToInput = (inputRef: any) => {
    if (!inputRef || !scrollViewRef.current) return;

    setTimeout(() => {
      inputRef.measureLayout(
        findNodeHandle(scrollViewRef.current),
        (x: number, y: number, width: number, height: number) => {
          // Calculate the position to scroll to
          const scrollToY = y - SCROLL_PADDING;
          
          scrollViewRef.current?.scrollTo({
            y: scrollToY,
            animated: true,
          });
        },
        (error: any) => {
          console.log("Error measuring input layout:", error);
        }
      );
    }, 100);
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
    return PRICING_CONFIG.zipcodeCharges[cleanZip] ?? 0;
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        ref={scrollViewRef}
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
              onFocus={(e) => scrollToInput(e.target)}
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
              onFocus={(e) => scrollToInput(e.target)}
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
              onFocus={(e) => scrollToInput(e.target)}
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
                  <Text style={styles.breakdownDiscountValue}>-${breakdown.discount.toFixed(2)}</Text>
                </View>

                <View style={styles.breakdownDivider} />

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>Total</Text>
                  <Text style={styles.breakdownTotalValue}>${breakdown.total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Clean & Seal Quote Section */}
              <View style={styles.cleanAndSealContainer}>
                <View style={styles.cleanAndSealHeader}>
                  <IconSymbol 
                    ios_icon_name="sparkles" 
                    android_material_icon_name="auto_awesome" 
                    size={24} 
                    color={colors.accent} 
                  />
                  <Text style={styles.cleanAndSealTitle}>Clean & Seal Service</Text>
                </View>
                
                {/* Original Price with Strikethrough */}
                <View style={styles.priceRow}>
                  <Text style={styles.cleanAndSealOriginalPrice}>
                    ${breakdown.cleanAndSealPrice.toFixed(2)}
                  </Text>
                </View>
                
                {/* Discounted Price */}
                <View style={styles.discountedPriceContainer}>
                  <View style={styles.discountBadge}>
                    <IconSymbol 
                      ios_icon_name="tag.fill" 
                      android_material_icon_name="local_offer" 
                      size={16} 
                      color="#ffffff" 
                    />
                    <Text style={styles.discountBadgeText}>20% Partner Discount</Text>
                  </View>
                  <Text style={styles.cleanAndSealDiscountedPrice}>
                    ${(breakdown.cleanAndSealPrice * 0.8).toFixed(2)}
                  </Text>
                </View>
                
                <Text style={styles.cleanAndSealDescription}>
                  {parseInt(hvacSystems) === 0 
                    ? `Based on ${getSqftRangeText(parseFloat(squareFootage))} with 1 HVAC system`
                    : `Based on ${parseInt(hvacSystems) + 1} total HVAC systems ($${PRICING_CONFIG.cleanAndSealPerHvac} per system)`
                  }
                </Text>
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
              - Square footage range (starting at $400, includes 1 HVAC system)
            </Text>
            <Text style={styles.infoText}>
              - Additional HVAC systems ($300 each)
            </Text>
            <Text style={styles.infoText}>
              - Location-based zipcode charges ($0-$200)
            </Text>
            <Text style={styles.infoText}>
              - 20% Partner Discount automatically applied
            </Text>
            <Text style={styles.infoText}>
              - Clean & Seal: $2,500+ (sqft-based) or $2,000 per HVAC system
            </Text>
          </View>
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
  logo: {
    width: 200,
    height: 100,
    marginBottom: 16,
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
  breakdownSubtotalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownSubtotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  breakdownDiscountLabel: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    flex: 1,
  },
  breakdownDiscountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
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
  cleanAndSealContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
  },
  cleanAndSealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cleanAndSealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  priceRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanAndSealOriginalPrice: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  discountedPriceContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  discountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cleanAndSealDiscountedPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.accent,
  },
  cleanAndSealDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
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
});
