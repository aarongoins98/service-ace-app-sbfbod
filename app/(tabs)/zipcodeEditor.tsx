
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

interface ZipcodeCharge {
  id: string;
  zipcode: string;
  charge: number;
}

export default function ZipcodeEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [zipcodes, setZipcodes] = useState<ZipcodeCharge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newZipcode, setNewZipcode] = useState("");
  const [newCharge, setNewCharge] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCharge, setEditCharge] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
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
  };

  const loadZipcodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('zipcode_charges')
        .select('*')
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

  const handleAddZipcode = async () => {
    if (!newZipcode || !newCharge) {
      Alert.alert("Missing Information", "Please enter both zipcode and charge.");
      return;
    }

    if (newZipcode.length !== 5) {
      Alert.alert("Invalid Zipcode", "Zipcode must be exactly 5 digits.");
      return;
    }

    const charge = parseFloat(newCharge);
    if (isNaN(charge) || charge < 0) {
      Alert.alert("Invalid Charge", "Charge must be a positive number.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('zipcode_charges')
        .insert([{ zipcode: newZipcode, charge }])
        .select();

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Duplicate Zipcode", "This zipcode already exists. Use edit to update it.");
        } else {
          console.error("Error adding zipcode:", error);
          Alert.alert("Error", "Failed to add zipcode.");
        }
        return;
      }

      console.log("Zipcode added successfully:", data);
      setNewZipcode("");
      setNewCharge("");
      loadZipcodes();
      Alert.alert("Success", "Zipcode added successfully!");
    } catch (error) {
      console.error("Error adding zipcode:", error);
      Alert.alert("Error", "An error occurred while adding zipcode.");
    }
  };

  const handleUpdateZipcode = async (id: string) => {
    const charge = parseFloat(editCharge);
    if (isNaN(charge) || charge < 0) {
      Alert.alert("Invalid Charge", "Charge must be a positive number.");
      return;
    }

    try {
      const { error } = await supabase
        .from('zipcode_charges')
        .update({ charge, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error("Error updating zipcode:", error);
        Alert.alert("Error", "Failed to update zipcode.");
        return;
      }

      console.log("Zipcode updated successfully");
      setEditingId(null);
      setEditCharge("");
      loadZipcodes();
      Alert.alert("Success", "Zipcode updated successfully!");
    } catch (error) {
      console.error("Error updating zipcode:", error);
      Alert.alert("Error", "An error occurred while updating zipcode.");
    }
  };

  const handleDeleteZipcode = async (id: string, zipcode: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete zipcode ${zipcode}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('zipcode_charges')
                .delete()
                .eq('id', id);

              if (error) {
                console.error("Error deleting zipcode:", error);
                Alert.alert("Error", "Failed to delete zipcode.");
                return;
              }

              console.log("Zipcode deleted successfully");
              loadZipcodes();
              Alert.alert("Success", "Zipcode deleted successfully!");
            } catch (error) {
              console.error("Error deleting zipcode:", error);
              Alert.alert("Error", "An error occurred while deleting zipcode.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_SESSION_KEY);
      router.replace("/(tabs)/adminLogin");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const filteredZipcodes = zipcodes.filter(z => 
    z.zipcode.includes(searchQuery) || 
    z.charge.toString().includes(searchQuery)
  );

  const groupedZipcodes = filteredZipcodes.reduce((acc, zipcode) => {
    const charge = zipcode.charge;
    if (!acc[charge]) {
      acc[charge] = [];
    }
    acc[charge].push(zipcode);
    return acc;
  }, {} as { [key: number]: ZipcodeCharge[] });

  const sortedCharges = Object.keys(groupedZipcodes)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <IconSymbol 
              ios_icon_name="map.fill" 
              android_material_icon_name="map" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.headerTitle}>Zipcode Manager</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.analyzerButton} 
              onPress={() => router.push("/(tabs)/zipcodeAnalyzer")}
              activeOpacity={0.8}
            >
              <IconSymbol 
                ios_icon_name="chart.bar.fill" 
                android_material_icon_name="analytics" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.analyzerButtonText}>Analyzer</Text>
            </TouchableOpacity>
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
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Add New Zipcode Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add New Zipcode</Text>
            <View style={styles.addForm}>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Zipcode *</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="84003"
                  placeholderTextColor={colors.textSecondary}
                  value={newZipcode}
                  onChangeText={setNewZipcode}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Charge ($) *</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={newCharge}
                  onChangeText={setNewCharge}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddZipcode}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add_circle" 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <IconSymbol 
              ios_icon_name="magnifyingglass" 
              android_material_icon_name="search" 
              size={20} 
              color={colors.textSecondary} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by zipcode or charge..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{zipcodes.length}</Text>
              <Text style={styles.statLabel}>Total Zipcodes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sortedCharges.length}</Text>
              <Text style={styles.statLabel}>Charge Tiers</Text>
            </View>
          </View>

          {/* Zipcode List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading zipcodes...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sortedCharges.map((charge) => (
                <View key={charge} style={styles.chargeGroup}>
                  <View style={styles.chargeHeader}>
                    <Text style={styles.chargeTitle}>${charge} Charge</Text>
                    <Text style={styles.chargeCount}>
                      {groupedZipcodes[charge].length} zipcode{groupedZipcodes[charge].length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  {groupedZipcodes[charge].map((zipcode) => (
                    <View key={zipcode.id} style={styles.zipcodeCard}>
                      {editingId === zipcode.id ? (
                        <View style={styles.editForm}>
                          <View style={styles.editLeft}>
                            <Text style={styles.zipcodeText}>{zipcode.zipcode}</Text>
                            <View style={styles.editInputContainer}>
                              <Text style={styles.dollarSign}>$</Text>
                              <TextInput
                                style={styles.editInput}
                                value={editCharge}
                                onChangeText={setEditCharge}
                                keyboardType="numeric"
                                autoFocus
                              />
                            </View>
                          </View>
                          <View style={styles.editActions}>
                            <TouchableOpacity 
                              style={styles.saveButton}
                              onPress={() => handleUpdateZipcode(zipcode.id)}
                              activeOpacity={0.8}
                            >
                              <IconSymbol 
                                ios_icon_name="checkmark.circle.fill" 
                                android_material_icon_name="check_circle" 
                                size={24} 
                                color="#22c55e" 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.cancelButton}
                              onPress={() => {
                                setEditingId(null);
                                setEditCharge("");
                              }}
                              activeOpacity={0.8}
                            >
                              <IconSymbol 
                                ios_icon_name="xmark.circle.fill" 
                                android_material_icon_name="cancel" 
                                size={24} 
                                color={colors.textSecondary} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.zipcodeRow}>
                          <View style={styles.zipcodeInfo}>
                            <Text style={styles.zipcodeText}>{zipcode.zipcode}</Text>
                            <Text style={styles.chargeText}>${zipcode.charge}</Text>
                          </View>
                          <View style={styles.actions}>
                            <TouchableOpacity 
                              style={styles.editButton}
                              onPress={() => {
                                setEditingId(zipcode.id);
                                setEditCharge(zipcode.charge.toString());
                              }}
                              activeOpacity={0.8}
                            >
                              <IconSymbol 
                                ios_icon_name="pencil.circle.fill" 
                                android_material_icon_name="edit" 
                                size={24} 
                                color={colors.primary} 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.deleteButton}
                              onPress={() => handleDeleteZipcode(zipcode.id, zipcode.zipcode)}
                              activeOpacity={0.8}
                            >
                              <IconSymbol 
                                ios_icon_name="trash.circle.fill" 
                                android_material_icon_name="delete" 
                                size={24} 
                                color={colors.error} 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  analyzerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  analyzerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
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
  addSection: {
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
    marginBottom: 16,
  },
  addForm: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  addInputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  addInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  listContainer: {
    gap: 16,
  },
  chargeGroup: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  chargeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chargeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chargeCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  zipcodeCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  zipcodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zipcodeInfo: {
    flex: 1,
  },
  zipcodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  chargeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  editForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editLeft: {
    flex: 1,
    gap: 8,
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dollarSign: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  editInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  saveButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 4,
  },
});
