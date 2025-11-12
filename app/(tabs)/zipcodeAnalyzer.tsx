
import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";

interface ZipcodeData {
  zipcode: string;
  charge: number;
}

// Utah County zipcode ranges (comprehensive list)
const UTAH_ZIPCODE_RANGES = {
  "Salt Lake County": {
    ranges: [
      { start: 84101, end: 84129 },
      { start: 84150, end: 84152 },
      { start: 84165, end: 84165 },
      { start: 84170, end: 84171 },
      { start: 84180, end: 84190 },
    ],
    cities: ["Salt Lake City", "West Valley City", "Sandy", "West Jordan", "Taylorsville", "Murray", "Draper", "Riverton", "South Jordan", "Midvale", "Cottonwood Heights", "Holladay", "Millcreek"]
  },
  "Utah County": {
    ranges: [
      { start: 84003, end: 84006 },
      { start: 84042, end: 84043 },
      { start: 84057, end: 84062 },
      { start: 84097, end: 84097 },
      { start: 84601, end: 84606 },
      { start: 84626, end: 84629 },
      { start: 84631, end: 84633 },
      { start: 84645, end: 84648 },
      { start: 84651, end: 84653 },
      { start: 84655, end: 84660 },
      { start: 84662, end: 84663 },
      { start: 84664, end: 84665 },
    ],
    cities: ["Provo", "Orem", "Lehi", "American Fork", "Pleasant Grove", "Springville", "Spanish Fork", "Payson", "Saratoga Springs", "Eagle Mountain", "Lindon", "Mapleton"]
  },
  "Davis County": {
    ranges: [
      { start: 84010, end: 84025 },
      { start: 84037, end: 84037 },
      { start: 84040, end: 84041 },
      { start: 84054, end: 84056 },
      { start: 84075, end: 84075 },
      { start: 84087, end: 84087 },
    ],
    cities: ["Layton", "Bountiful", "Farmington", "Kaysville", "Clearfield", "Syracuse", "Clinton", "Centerville", "Woods Cross", "North Salt Lake", "Fruit Heights"]
  },
  "Weber County": {
    ranges: [
      { start: 84401, end: 84415 },
      { start: 84067, end: 84067 },
    ],
    cities: ["Ogden", "Roy", "Riverdale", "South Ogden", "Washington Terrace", "North Ogden", "Pleasant View", "Harrisville", "Farr West"]
  },
  "Summit County": {
    ranges: [
      { start: 84017, end: 84017 },
      { start: 84032, end: 84036 },
      { start: 84049, end: 84049 },
      { start: 84060, end: 84061 },
      { start: 84068, end: 84068 },
      { start: 84098, end: 84098 },
    ],
    cities: ["Park City", "Heber City", "Coalville", "Kamas", "Oakley", "Francis"]
  },
  "Tooele County": {
    ranges: [
      { start: 84029, end: 84029 },
      { start: 84074, end: 84074 },
      { start: 84081, end: 84081 },
    ],
    cities: ["Tooele", "Grantsville", "Stansbury Park"]
  },
  "Cache County": {
    ranges: [
      { start: 84302, end: 84302 },
      { start: 84310, end: 84341 },
    ],
    cities: ["Logan", "North Logan", "Smithfield", "Hyde Park", "Providence", "Nibley", "Hyrum", "Millville"]
  },
};

export default function ZipcodeAnalyzerScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [zipcodes, setZipcodes] = useState<ZipcodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [missingZipcodes, setMissingZipcodes] = useState<number[]>([]);
  const [searchZipcode, setSearchZipcode] = useState("");
  const [nearbyMissing, setNearbyMissing] = useState<number[]>([]);

  const loadZipcodes = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('zipcode_charges')
        .select('zipcode, charge')
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
  }, []);

  const checkAdminSession = useCallback(async () => {
    try {
      const session = await AsyncStorage.getItem(ADMIN_SESSION_KEY);
      if (session !== "true") {
        Alert.alert("Access Denied", "Please login as admin first.");
        router.replace("/(tabs)/adminLogin");
        return;
      }
      loadZipcodes();
    } catch (error) {
      console.error("Error checking admin session:", error);
      router.replace("/(tabs)/adminLogin");
    }
  }, [router, loadZipcodes]);

  useEffect(() => {
    checkAdminSession();
  }, [checkAdminSession]);

  const analyzeCounty = (countyName: string) => {
    const county = UTAH_ZIPCODE_RANGES[countyName];
    if (!county) return;

    const existingZipcodes = new Set(zipcodes.map(z => parseInt(z.zipcode)));
    const missing: number[] = [];

    county.ranges.forEach(range => {
      for (let zip = range.start; zip <= range.end; zip++) {
        if (!existingZipcodes.has(zip)) {
          missing.push(zip);
        }
      }
    });

    setMissingZipcodes(missing);
    setSelectedCounty(countyName);
  };

  const findNearbyMissing = () => {
    if (!searchZipcode || searchZipcode.length !== 5) {
      Alert.alert("Invalid Input", "Please enter a valid 5-digit zipcode.");
      return;
    }

    const baseZip = parseInt(searchZipcode);
    const existingZipcodes = new Set(zipcodes.map(z => parseInt(z.zipcode)));
    const nearby: number[] = [];

    // Check 20 zipcodes before and after
    for (let i = baseZip - 20; i <= baseZip + 20; i++) {
      if (i >= 84000 && i <= 84999 && !existingZipcodes.has(i)) {
        nearby.push(i);
      }
    }

    setNearbyMissing(nearby);
  };

  const getCountyCoverage = (countyName: string): { total: number; covered: number; percentage: number } => {
    const county = UTAH_ZIPCODE_RANGES[countyName];
    if (!county) return { total: 0, covered: 0, percentage: 0 };

    const existingZipcodes = new Set(zipcodes.map(z => parseInt(z.zipcode)));
    let total = 0;
    let covered = 0;

    county.ranges.forEach(range => {
      for (let zip = range.start; zip <= range.end; zip++) {
        total++;
        if (existingZipcodes.has(zip)) {
          covered++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((covered / total) * 100) : 0;
    return { total, covered, percentage };
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      router.replace("/(tabs)/adminLogin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading zipcode data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <IconSymbol 
            ios_icon_name="chart.bar.fill" 
            android_material_icon_name="analytics" 
            size={28} 
            color={colors.primary} 
          />
          <Text style={styles.headerTitle}>Zipcode Analyzer</Text>
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
        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Coverage Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{zipcodes.length}</Text>
              <Text style={styles.statLabel}>Total Zipcodes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(UTAH_ZIPCODE_RANGES).length}</Text>
              <Text style={styles.statLabel}>Counties</Text>
            </View>
          </View>
        </View>

        {/* Find Nearby Missing */}
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Find Missing Zipcodes Near You</Text>
          <Text style={styles.sectionDescription}>
            Enter a zipcode to find missing zipcodes within ±20 range
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter zipcode (e.g., 84003)"
              placeholderTextColor={colors.textSecondary}
              value={searchZipcode}
              onChangeText={setSearchZipcode}
              keyboardType="numeric"
              maxLength={5}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={findNearbyMissing}
              activeOpacity={0.8}
            >
              <IconSymbol 
                ios_icon_name="magnifyingglass" 
                android_material_icon_name="search" 
                size={20} 
                color="#ffffff" 
              />
            </TouchableOpacity>
          </View>

          {nearbyMissing.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                Found {nearbyMissing.length} missing zipcode{nearbyMissing.length !== 1 ? 's' : ''} near {searchZipcode}:
              </Text>
              <View style={styles.zipcodeGrid}>
                {nearbyMissing.map((zip, index) => (
                  <View key={index} style={styles.zipcodeChip}>
                    <Text style={styles.zipcodeChipText}>{zip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* County Analysis */}
        <View style={styles.countySection}>
          <Text style={styles.sectionTitle}>County Coverage Analysis</Text>
          <Text style={styles.sectionDescription}>
            Tap a county to see missing zipcodes in that area
          </Text>
          
          {Object.keys(UTAH_ZIPCODE_RANGES).map((countyName) => {
            const coverage = getCountyCoverage(countyName);
            const county = UTAH_ZIPCODE_RANGES[countyName];
            
            return (
              <TouchableOpacity
                key={countyName}
                style={[
                  styles.countyCard,
                  selectedCounty === countyName && styles.countyCardSelected
                ]}
                onPress={() => analyzeCounty(countyName)}
                activeOpacity={0.8}
              >
                <View style={styles.countyHeader}>
                  <View style={styles.countyInfo}>
                    <Text style={styles.countyName}>{countyName}</Text>
                    <Text style={styles.countyCities}>
                      {county.cities.slice(0, 3).join(", ")}
                      {county.cities.length > 3 && ` +${county.cities.length - 3} more`}
                    </Text>
                  </View>
                  <View style={styles.coverageBadge}>
                    <Text style={styles.coveragePercentage}>{coverage.percentage}%</Text>
                  </View>
                </View>
                
                <View style={styles.coverageBar}>
                  <View 
                    style={[
                      styles.coverageBarFill, 
                      { width: `${coverage.percentage}%` }
                    ]} 
                  />
                </View>
                
                <Text style={styles.coverageText}>
                  {coverage.covered} of {coverage.total} zipcodes covered
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Missing Zipcodes for Selected County */}
        {selectedCounty && missingZipcodes.length > 0 && (
          <View style={styles.missingSection}>
            <Text style={styles.missingSectionTitle}>
              Missing Zipcodes in {selectedCounty}
            </Text>
            <Text style={styles.missingSectionDescription}>
              {missingZipcodes.length} zipcode{missingZipcodes.length !== 1 ? 's' : ''} not in your database
            </Text>
            <View style={styles.zipcodeGrid}>
              {missingZipcodes.map((zip, index) => (
                <View key={index} style={styles.missingZipcodeChip}>
                  <Text style={styles.missingZipcodeText}>{zip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedCounty && missingZipcodes.length === 0 && (
          <View style={styles.completeSection}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check_circle" 
              size={48} 
              color="#22c55e" 
            />
            <Text style={styles.completeTitle}>Complete Coverage!</Text>
            <Text style={styles.completeDescription}>
              You have all zipcodes for {selectedCounty}
            </Text>
          </View>
        )}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  zipcodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zipcodeChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  zipcodeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  countySection: {
    marginBottom: 20,
  },
  countyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  countyCardSelected: {
    borderColor: colors.primary,
  },
  countyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  countyInfo: {
    flex: 1,
  },
  countyName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  countyCities: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  coverageBadge: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coveragePercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  coverageBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  coverageBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  coverageText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  missingSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.error,
  },
  missingSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  missingSectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  missingZipcodeChip: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  missingZipcodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  completeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  completeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  completeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
