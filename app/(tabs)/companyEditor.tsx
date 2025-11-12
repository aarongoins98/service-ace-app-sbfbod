
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

interface Company {
  id: string;
  name: string;
}

export default function CompanyEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
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
      loadCompanies();
    } catch (error) {
      console.error("Error checking admin session:", error);
      router.replace("/(tabs)/adminLogin");
    }
  };

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error loading companies:", error);
        Alert.alert("Error", "Failed to load company data.");
        return;
      }

      setCompanies(data || []);
      console.log(`Loaded ${data?.length || 0} companies`);
    } catch (error) {
      console.error("Error loading companies:", error);
      Alert.alert("Error", "An error occurred while loading companies.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) {
      Alert.alert("Missing Information", "Please enter a company name.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name: newCompanyName.trim() }])
        .select();

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Duplicate Company", "This company name already exists.");
        } else {
          console.error("Error adding company:", error);
          Alert.alert("Error", "Failed to add company.");
        }
        return;
      }

      console.log("Company added successfully:", data);
      setNewCompanyName("");
      loadCompanies();
      Alert.alert("Success", "Company added successfully!");
    } catch (error) {
      console.error("Error adding company:", error);
      Alert.alert("Error", "An error occurred while adding company.");
    }
  };

  const handleUpdateCompany = async (id: string) => {
    if (!editName.trim()) {
      Alert.alert("Missing Information", "Company name cannot be empty.");
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: editName.trim(), updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Duplicate Company", "This company name already exists.");
        } else {
          console.error("Error updating company:", error);
          Alert.alert("Error", "Failed to update company.");
        }
        return;
      }

      console.log("Company updated successfully");
      setEditingId(null);
      setEditName("");
      loadCompanies();
      Alert.alert("Success", "Company updated successfully!");
    } catch (error) {
      console.error("Error updating company:", error);
      Alert.alert("Error", "An error occurred while updating company.");
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('companies')
                .delete()
                .eq('id', id);

              if (error) {
                console.error("Error deleting company:", error);
                Alert.alert("Error", "Failed to delete company.");
                return;
              }

              console.log("Company deleted successfully");
              loadCompanies();
              Alert.alert("Success", "Company deleted successfully!");
            } catch (error) {
              console.error("Error deleting company:", error);
              Alert.alert("Error", "An error occurred while deleting company.");
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

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <IconSymbol 
              ios_icon_name="building.2.fill" 
              android_material_icon_name="business" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.headerTitle}>Company Manager</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.zipcodeButton} 
              onPress={() => router.push("/(tabs)/zipcodeEditor")}
              activeOpacity={0.8}
            >
              <IconSymbol 
                ios_icon_name="map.fill" 
                android_material_icon_name="map" 
                size={20} 
                color={colors.primary} 
              />
              <Text style={styles.zipcodeButtonText}>Zipcodes</Text>
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
          {/* Add New Company Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add New Company</Text>
            <View style={styles.addForm}>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Company Name *</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Enter company name"
                  placeholderTextColor={colors.textSecondary}
                  value={newCompanyName}
                  onChangeText={setNewCompanyName}
                  autoCapitalize="words"
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddCompany}
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
              placeholder="Search companies..."
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
              <Text style={styles.statValue}>{companies.length}</Text>
              <Text style={styles.statLabel}>Total Companies</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{filteredCompanies.length}</Text>
              <Text style={styles.statLabel}>Filtered Results</Text>
            </View>
          </View>

          {/* Company List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading companies...</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredCompanies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol 
                    ios_icon_name="building.2" 
                    android_material_icon_name="business" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery ? "No companies found" : "No companies yet. Add one above!"}
                  </Text>
                </View>
              ) : (
                filteredCompanies.map((company) => (
                  <View key={company.id} style={styles.companyCard}>
                    {editingId === company.id ? (
                      <View style={styles.editForm}>
                        <View style={styles.editLeft}>
                          <TextInput
                            style={styles.editInput}
                            value={editName}
                            onChangeText={setEditName}
                            autoFocus
                            autoCapitalize="words"
                          />
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity 
                            style={styles.saveButton}
                            onPress={() => handleUpdateCompany(company.id)}
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
                              setEditName("");
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
                      <View style={styles.companyRow}>
                        <View style={styles.companyInfo}>
                          <IconSymbol 
                            ios_icon_name="building.2.fill" 
                            android_material_icon_name="business" 
                            size={20} 
                            color={colors.primary} 
                          />
                          <Text style={styles.companyText}>{company.name}</Text>
                        </View>
                        <View style={styles.actions}>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => {
                              setEditingId(company.id);
                              setEditName(company.name);
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
                            onPress={() => handleDeleteCompany(company.id, company.name)}
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
                ))
              )}
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
  zipcodeButton: {
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
  zipcodeButtonText: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    gap: 12,
  },
  companyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
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
    gap: 12,
  },
  editLeft: {
    flex: 1,
  },
  editInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    padding: 4,
  },
  cancelButton: {
    padding: 4,
  },
});
