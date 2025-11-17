
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
import { supabase } from "@/app/integrations/supabase/client";

// Pricing Configuration
// You can easily update these values to adjust pricing
const PRICING_CONFIG = {
  // Square footage ranges with their base prices
  // Format: { maxSqFt: price }
  // Ranges: 0-999, 1000-1999, 2000-2999, etc.
  // Updated to $100 increments instead of $50
  sqftRanges: [
    { min: 0, max: 999, price: 400 },
    { min: 1000, max: 1999, price: 500 },
    { min: 2000, max: 2999, price: 600 },
    { min: 3000, max: 3999, price: 700 },
    { min: 4000, max: 4999, price: 800 },
    { min: 5000, max: 5999, price: 900 },
    { min: 6000, max: 6999, price: 1000 },
    { min: 7000, max: 7999, price: 1100 },
    { min: 8000, max: 8999, price: 1200 },
    { min: 9000, max: 9999, price: 1300 },
    { min: 10000, max: Infinity, price: 1400 },
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

interface AddOnService {
  id: string;
  service_name: string;
  price: number;
  description: string;
  enabled: boolean;
  quantity: number;
}

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
    subtotal: number;
    discount: number;
    total: number;
    cleanAndSealPrice: number;
    addOnsTotal: number;
  } | null>(null);
  
  // State for zipcode charges from Supabase
  const [zipcodeCharges, setZipcodeCharges] = useState<{ [key: string]: number }>({});
  const [isLoadingZipcodes, setIsLoadingZipcodes] = useState(true);
  
  // State for add-on services
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>([]);

  useEffect(() => {
    loadZipcodeCharges();
    loadAddOnServices();
  }, []);

  const loadZipcodeCharges = async () => {
    try {
      setIsLoadingZipcodes(true);
      console.log("Loading zipcode charges from Supabase...");
      
      const { data, error } = await supabase
        .from('zipcode_charges')
        .select('zipcode, charge');

      if (error) {
        console.error("Error loading zipcode charges:", error);
        Alert.alert("Error", "Failed to load zipcode data. Using default charges.");
        return;
      }

      // Convert array to object for easy lookup
      const chargesMap: { [key: string]: number } = {};
      data?.forEach((item) => {
        chargesMap[item.zipcode] = item.charge;
      });

      setZipcodeCharges(chargesMap);
      console.log(`Loaded ${data?.length || 0} zipcode charges from Supabase`);
    } catch (error) {
      console.error("Error loading zipcode charges:", error);
      Alert.alert("Error", "An error occurred while loading zipcode data.");
    } finally {
      setIsLoadingZipcodes(false);
    }
  };

  const loadAddOnServices = async () => {
    try {
      console.log("Loading add-on services from Supabase...");
      
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .in('service_name', [
          'dryer_vent',
          'anti_microbial_fogging',
          'evap_coil_cleaning',
          'outdoor_coil_cleaning',
          'bathroom_fan_cleaning'
        ]);

      if (error) {
        console.error("Error loading add-on services:", error);
        return;
      }

      const services: AddOnService[] = (data || []).map(item => ({
        id: item.id,
        service_name: item.service_name,
        price: parseFloat(item.price),
        description: item.description,
        enabled: false,
        quantity: 1,
      }));

      setAddOnServices(services);
      console.log(`Loaded ${services.length} add-on services`);
    } catch (error) {
      console.error("Error loading add-on services:", error);
    }
  };

  const toggleAddOn = (serviceId: string) => {
    setAddOnServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  };

  const updateAddOnQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setAddOnServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, quantity }
          : service
      )
    );
  };

  const getAddOnDisplayName = (serviceName: string): string => {
    const names: { [key: string]: string } = {
      'dryer_vent': 'Dryer Vent',
      'anti_microbial_fogging': 'Anti-Microbial Fogging',
      'evap_coil_cleaning': 'In-place Evap Coil Cleaning',
      'outdoor_coil_cleaning': 'Outdoor Coil Cleaning',
      'bathroom_fan_cleaning': 'Bathroom Fan Cleaning',
    };
    return names[serviceName] || serviceName;
  };

  const getAddOnIcon = (serviceName: string): { ios: string; android: string } => {
    const icons: { [key: string]: { ios: string; android: string } } = {
      'dryer_vent': { ios: 'wind', android: 'air' },
      'anti_microbial_fogging': { ios: 'sparkles', android: 'auto_awesome' },
      'evap_coil_cleaning': { ios: 'snowflake', android: 'ac_unit' },
      'outdoor_coil_cleaning': { ios: 'fan.fill', android: 'hvac' },
      'bathroom_fan_cleaning': { ios: 'fan.badge.automatic', android: 'mode_fan' },
    };
    return icons[serviceName] || { ios: 'plus.circle', android: 'add_circle' };
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
    
    // Look up charge from Supabase data
    const charge = zipcodeCharges[cleanZip];
    
    if (charge !== undefined) {
      console.log(`Zipcode ${cleanZip} charge from Supabase: $${charge}`);
      return charge;
    }
    
    console.log(`Zipcode ${cleanZip} not found in database, using $0 default`);
    return 0;
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

  const calculateAddOnsTotal = (): number => {
    return addOnServices
      .filter(service => service.enabled)
      .reduce((total, service) => total + (service.price * service.quantity), 0);
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
    const addOnsTotal = calculateAddOnsTotal();
    const subtotal = sqftCharge + hvacCharge + zipcodeCharge + addOnsTotal;
    
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
      addOnsTotal,
    });
    setQuote(total);

    console.log('Quote calculated:', {
      squareFootage: sqFt,
      hvacSystems: hvacCount,
      zipcode,
      sqftCharge,
      hvacCharge,
      zipcodeCharge,
      addOnsTotal,
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
    setAddOnServices(prev => prev.map(service => ({ ...service, enabled: false, quantity: 1 })));
  };

  const getSqftRangeText = (sqft: number): string => {
    const range = PRICING_CONFIG.sqftRanges.find(
      r => sqft >= r.min && sqft <= r.max
    );
    if (!range) return "Unknown range";
    if (range.max === Infinity) return `${range.min}+ sqft`;
    return `${range.min}-${range.max} sqft`;
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
            size={64} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Pricing Tool</Text>
          <Text style={styles.subtitle}>Generate accurate service quotes</Text>
          
          {/* Refresh button for zipcode data */}
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadZipcodeCharges}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="arrow.clockwise" 
              android_material_icon_name="refresh" 
              size={16} 
              color={colors.primary} 
            />
            <Text style={styles.refreshButtonText}>Refresh Zipcode Data</Text>
          </TouchableOpacity>
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

          {/* Add-On Services Section */}
          {addOnServices.length > 0 && (
            <View style={styles.addOnsSection}>
              <Text style={styles.addOnsTitle}>Additional Services (Optional)</Text>
              <Text style={styles.addOnsSubtitle}>Select any additional services and specify quantity</Text>
              
              {addOnServices.map((service) => {
                const icon = getAddOnIcon(service.service_name);
                
                return (
                  <View key={service.id} style={styles.addOnItem}>
                    <TouchableOpacity 
                      style={styles.addOnCheckbox}
                      onPress={() => toggleAddOn(service.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        service.enabled && styles.checkboxChecked
                      ]}>
                        {service.enabled && (
                          <IconSymbol 
                            ios_icon_name="checkmark" 
                            android_material_icon_name="check" 
                            size={16} 
                            color="#ffffff" 
                          />
                        )}
                      </View>
                      <View style={styles.addOnInfo}>
                        <View style={styles.addOnHeader}>
                          <IconSymbol 
                            ios_icon_name={icon.ios} 
                            android_material_icon_name={icon.android} 
                            size={20} 
                            color={service.enabled ? colors.primary : colors.textSecondary} 
                          />
                          <Text style={[
                            styles.addOnName,
                            service.enabled && styles.addOnNameActive
                          ]}>
                            {getAddOnDisplayName(service.service_name)}
                          </Text>
                        </View>
                        <Text style={styles.addOnPrice}>
                          ${service.price.toFixed(2)} each
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {service.enabled && (
                      <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Quantity:</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateAddOnQuantity(service.id, service.quantity - 1)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol 
                              ios_icon_name="minus" 
                              android_material_icon_name="remove" 
                              size={16} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantityValue}>{service.quantity}</Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateAddOnQuantity(service.id, service.quantity + 1)}
                            activeOpacity={0.7}
                          >
                            <IconSymbol 
                              ios_icon_name="plus" 
                              android_material_icon_name="add" 
                              size={16} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.quantityTotal}>
                          Total: ${(service.price * service.quantity).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

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

                {breakdown.addOnsTotal > 0 && (
                  <React.Fragment>
                    <View style={styles.breakdownDivider} />
                    <Text style={styles.breakdownSubtitle}>Additional Services</Text>
                    {addOnServices
                      .filter(service => service.enabled)
                      .map((service) => {
                        const icon = getAddOnIcon(service.service_name);
                        const total = service.price * service.quantity;
                        return (
                          <View key={service.id} style={styles.breakdownRow}>
                            <View style={styles.breakdownLeft}>
                              <IconSymbol 
                                ios_icon_name={icon.ios} 
                                android_material_icon_name={icon.android} 
                                size={16} 
                                color={colors.textSecondary} 
                              />
                              <Text style={styles.breakdownLabel}>
                                {getAddOnDisplayName(service.service_name)}
                                {service.quantity > 1 ? ` (${service.quantity} × $${service.price.toFixed(2)})` : ''}
                              </Text>
                            </View>
                            <Text style={styles.breakdownValue}>${total.toFixed(2)}</Text>
                          </View>
                        );
                      })}
                  </React.Fragment>
                )}

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
              - Square footage range (starting at $400, $100 increments, includes 1 HVAC system)
            </Text>
            <Text style={styles.infoText}>
              - Additional HVAC systems ($300 each)
            </Text>
            <Text style={styles.infoText}>
              - Location-based zipcode charges (loaded from database)
            </Text>
            <Text style={styles.infoText}>
              - Optional add-on services with customizable quantities
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
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
  addOnsSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  addOnsSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addOnItem: {
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addOnCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addOnNameActive: {
    color: colors.text,
  },
  addOnPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 28,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
  breakdownSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    marginBottom: 8,
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
