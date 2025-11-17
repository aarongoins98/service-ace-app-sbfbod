
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
  Switch,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/app/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_session";

interface AdditionalService {
  id: string;
  service_name: string;
  price: number;
  description: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export default function ServicesEditorScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [services, setServices] = useState<AdditionalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add new service form
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");

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
      
      console.log("Admin session verified, loading services");
      setIsCheckingAuth(false);
      loadServices();
    } catch (error) {
      console.error("Error checking admin session:", error);
      Alert.alert("Error", "Failed to verify admin session. Please login again.");
      router.replace("/(tabs)/adminLogin");
    }
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);
      
      // Load only add-on services (not base pricing)
      const addOnServiceNames = [
        'dryer_vent',
        'anti_microbial_fogging',
        'evap_coil_cleaning',
        'outdoor_coil_cleaning',
        'bathroom_fan_cleaning'
      ];
      
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .in('service_name', addOnServiceNames)
        .order('service_name', { ascending: true });

      if (error) {
        console.error("Error loading services:", error);
        Alert.alert("Error", "Failed to load service data.");
        return;
      }

      // Add is_hidden field (default to false if not in database)
      const servicesWithHidden = (data || []).map(service => ({
        ...service,
        is_hidden: service.is_hidden || false
      }));

      setServices(servicesWithHidden);
      console.log(`Loaded ${servicesWithHidden.length} additional services`);
    } catch (error) {
      console.error("Error loading services:", error);
      Alert.alert("Error", "An error occurred while loading services.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddService = async () => {
    if (!newServiceName.trim()) {
      Alert.alert("Missing Information", "Please enter a service name.");
      return;
    }
    
    if (!newServicePrice.trim() || isNaN(parseFloat(newServicePrice))) {
      Alert.alert("Invalid Price", "Please enter a valid price.");
      return;
    }

    try {
      // Convert service name to snake_case for database
      const serviceNameKey = newServiceName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      const { data, error } = await supabase
        .from('service_prices')
        .insert([{ 
          service_name: serviceNameKey,
          price: parseFloat(newServicePrice),
          description: newServiceDescription.trim() || newServiceName.trim(),
          is_hidden: false
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          Alert.alert("Duplicate Service", "This service name already exists.");
        } else {
          console.error("Error adding service:", error);
          Alert.alert("Error", "Failed to add service.");
        }
        return;
      }

      console.log("Service added successfully:", data);
      setNewServiceName("");
      setNewServicePrice("");
      setNewServiceDescription("");
      loadServices();
      Alert.alert("Success", "Service added successfully!");
    } catch (error) {
      console.error("Error adding service:", error);
      Alert.alert("Error", "An error occurred while adding service.");
    }
  };

  const handleUpdateService = async (id: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      Alert.alert("Invalid Price", "Price must be a positive number.");
      return;
    }
    
    if (!editName.trim()) {
      Alert.alert("Missing Information", "Service name cannot be empty.");
      return;
    }

    try {
      const { error } = await supabase
        .from('service_prices')
        .update({ 
          price,
          description: editDescription.trim(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error("Error updating service:", error);
        Alert.alert("Error", "Failed to update service.");
        return;
      }

      console.log("Service updated successfully");
      setEditingId(null);
      setEditName("");
      setEditPrice("");
      setEditDescription("");
      loadServices();
      Alert.alert("Success", "Service updated successfully!");
    } catch (error) {
      console.error("Error updating service:", error);
      Alert.alert("Error", "An error occurred while updating service.");
    }
  };

  const handleToggleVisibility = async (id: string, currentHidden: boolean, serviceName: string) => {
    try {
      const { error } = await supabase
        .from('service_prices')
        .update({ 
          is_hidden: !currentHidden,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error("Error toggling visibility:", error);
        Alert.alert("Error", "Failed to update service visibility.");
        return;
      }

      console.log("Service visibility toggled successfully");
      loadServices();
      Alert.alert("Success", `Service ${!currentHidden ? 'hidden' : 'shown'} successfully!`);
    } catch (error) {
      console.error("Error toggling visibility:", error);
      Alert.alert("Error", "An error occurred while updating visibility.");
    }
  };

  const handleDeleteService = async (id: string, serviceName: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to permanently delete "${getDisplayName(serviceName)}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Attempting to delete service with ID:", id);
              
              const { error } = await supabase
                .from('service_prices')
                .delete()
                .eq('id', id);

              if (error) {
                console.error("Error deleting service:", error);
                Alert.alert("Error", `Failed to delete service: ${error.message}`);
                return;
              }

              console.log("Service deleted successfully");
              loadServices();
              Alert.alert("Success", "Service deleted successfully!");
            } catch (error) {
              console.error("Error deleting service:", error);
              Alert.alert("Error", "An error occurred while deleting service.");
            }
          },
        },
      ]
    );
  };

  const getDisplayName = (serviceName: string): string => {
    const names: { [key: string]: string } = {
      'dryer_vent': 'Dryer Vent Cleaning',
      'anti_microbial_fogging': 'Anti-Microbial Fogging',
      'evap_coil_cleaning': 'In-place Evap Coil Cleaning',
      'outdoor_coil_cleaning': 'Outdoor Coil Cleaning',
      'bathroom_fan_cleaning': 'Bathroom Fan Cleaning',
    };
    return names[serviceName] || serviceName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  const filteredServices = services.filter(s => 
    getDisplayName(s.service_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleServices = filteredServices.filter(s => !s.is_hidden);
  const hiddenServices = filteredServices.filter(s => s.is_hidden);

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
              ios_icon_name="wrench.and.screwdriver.fill" 
              android_material_icon_name="build" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.headerTitle}>Services Manager</Text>
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
          {/* Info Card */}
          <View style={styles.infoCard}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={24} 
              color={colors.primary} 
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Additional Services Management</Text>
              <Text style={styles.infoText}>
                Add new services, edit prices, hide services from the pricing tool, or permanently delete services. Hidden services won&apos;t appear in quotes but remain in the database.
              </Text>
            </View>
          </View>

          {/* Add New Service Section */}
          <View style={styles.addSection}>
            <Text style={styles.sectionTitle}>Add New Service</Text>
            <View style={styles.addForm}>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Service Name *</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="e.g., UV Light Installation"
                  placeholderTextColor={colors.textSecondary}
                  value={newServiceName}
                  onChangeText={setNewServiceName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Price *</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={newServicePrice}
                    onChangeText={setNewServicePrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.addInputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={styles.addInput}
                  placeholder="Brief description of the service"
                  placeholderTextColor={colors.textSecondary}
                  value={newServiceDescription}
                  onChangeText={setNewServiceDescription}
                  autoCapitalize="sentences"
                />
              </View>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddService}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="plus.circle.fill" 
                  android_material_icon_name="add_circle" 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.addButtonText}>Add Service</Text>
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
              placeholder="Search services..."
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
              <Text style={styles.statValue}>{visibleServices.length}</Text>
              <Text style={styles.statLabel}>Visible Services</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{hiddenServices.length}</Text>
              <Text style={styles.statLabel}>Hidden Services</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{services.length}</Text>
              <Text style={styles.statLabel}>Total Services</Text>
            </View>
          </View>

          {/* Service List */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading services...</Text>
            </View>
          ) : (
            <React.Fragment>
              {/* Visible Services */}
              {visibleServices.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>Active Services</Text>
                  <View style={styles.listContainer}>
                    {visibleServices.map((service) => (
                      <View key={service.id} style={styles.serviceCard}>
                        {editingId === service.id ? (
                          <View style={styles.editForm}>
                            <View style={styles.editInputGroup}>
                              <Text style={styles.label}>Service Name</Text>
                              <TextInput
                                style={styles.editInput}
                                value={editName}
                                onChangeText={setEditName}
                                autoCapitalize="words"
                                editable={false}
                              />
                            </View>
                            <View style={styles.editInputGroup}>
                              <Text style={styles.label}>Price</Text>
                              <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                  style={styles.priceInput}
                                  value={editPrice}
                                  onChangeText={setEditPrice}
                                  keyboardType="numeric"
                                  autoFocus
                                />
                              </View>
                            </View>
                            <View style={styles.editInputGroup}>
                              <Text style={styles.label}>Description</Text>
                              <TextInput
                                style={styles.editInput}
                                value={editDescription}
                                onChangeText={setEditDescription}
                                autoCapitalize="sentences"
                              />
                            </View>
                            <View style={styles.editActions}>
                              <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={() => handleUpdateService(service.id)}
                                activeOpacity={0.8}
                              >
                                <IconSymbol 
                                  ios_icon_name="checkmark.circle.fill" 
                                  android_material_icon_name="check_circle" 
                                  size={24} 
                                  color="#22c55e" 
                                />
                                <Text style={styles.saveButtonText}>Save</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => {
                                  setEditingId(null);
                                  setEditName("");
                                  setEditPrice("");
                                  setEditDescription("");
                                }}
                                activeOpacity={0.8}
                              >
                                <IconSymbol 
                                  ios_icon_name="xmark.circle.fill" 
                                  android_material_icon_name="cancel" 
                                  size={24} 
                                  color={colors.textSecondary} 
                                />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <React.Fragment>
                            <View style={styles.serviceHeader}>
                              <View style={styles.serviceInfo}>
                                <IconSymbol 
                                  ios_icon_name="wrench.and.screwdriver.fill" 
                                  android_material_icon_name="build" 
                                  size={20} 
                                  color={colors.primary} 
                                />
                                <View style={styles.serviceTextContainer}>
                                  <Text style={styles.serviceName}>{getDisplayName(service.service_name)}</Text>
                                  <Text style={styles.serviceDescription}>{service.description}</Text>
                                </View>
                              </View>
                              <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
                            </View>
                            <View style={styles.serviceActions}>
                              <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => {
                                  setEditingId(service.id);
                                  setEditName(getDisplayName(service.service_name));
                                  setEditPrice(service.price.toString());
                                  setEditDescription(service.description);
                                }}
                                activeOpacity={0.8}
                              >
                                <IconSymbol 
                                  ios_icon_name="pencil.circle.fill" 
                                  android_material_icon_name="edit" 
                                  size={24} 
                                  color={colors.primary} 
                                />
                                <Text style={styles.actionButtonText}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => handleToggleVisibility(service.id, service.is_hidden, service.service_name)}
                                activeOpacity={0.8}
                              >
                                <IconSymbol 
                                  ios_icon_name="eye.slash.fill" 
                                  android_material_icon_name="visibility_off" 
                                  size={24} 
                                  color="#f59e0b" 
                                />
                                <Text style={styles.actionButtonText}>Hide</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={styles.actionButton}
                                onPress={() => handleDeleteService(service.id, service.service_name)}
                                activeOpacity={0.8}
                              >
                                <IconSymbol 
                                  ios_icon_name="trash.circle.fill" 
                                  android_material_icon_name="delete" 
                                  size={24} 
                                  color={colors.error} 
                                />
                                <Text style={styles.actionButtonText}>Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </React.Fragment>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Hidden Services */}
              {hiddenServices.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>Hidden Services</Text>
                  <View style={styles.listContainer}>
                    {hiddenServices.map((service) => (
                      <View key={service.id} style={[styles.serviceCard, styles.hiddenServiceCard]}>
                        <View style={styles.serviceHeader}>
                          <View style={styles.serviceInfo}>
                            <IconSymbol 
                              ios_icon_name="eye.slash" 
                              android_material_icon_name="visibility_off" 
                              size={20} 
                              color={colors.textSecondary} 
                            />
                            <View style={styles.serviceTextContainer}>
                              <Text style={[styles.serviceName, styles.hiddenText]}>{getDisplayName(service.service_name)}</Text>
                              <Text style={[styles.serviceDescription, styles.hiddenText]}>{service.description}</Text>
                            </View>
                          </View>
                          <Text style={[styles.servicePrice, styles.hiddenText]}>${service.price.toFixed(2)}</Text>
                        </View>
                        <View style={styles.serviceActions}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleToggleVisibility(service.id, service.is_hidden, service.service_name)}
                            activeOpacity={0.8}
                          >
                            <IconSymbol 
                              ios_icon_name="eye.fill" 
                              android_material_icon_name="visibility" 
                              size={24} 
                              color="#22c55e" 
                            />
                            <Text style={styles.actionButtonText}>Show</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDeleteService(service.id, service.service_name)}
                            activeOpacity={0.8}
                          >
                            <IconSymbol 
                              ios_icon_name="trash.circle.fill" 
                              android_material_icon_name="delete" 
                              size={24} 
                              color={colors.error} 
                            />
                            <Text style={styles.actionButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {filteredServices.length === 0 && (
                <View style={styles.emptyContainer}>
                  <IconSymbol 
                    ios_icon_name="wrench.and.screwdriver" 
                    android_material_icon_name="build" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>
                    {searchQuery ? "No services found" : "No services yet. Add one above!"}
                  </Text>
                </View>
              )}
            </React.Fragment>
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
    gap: 16,
  },
  addInputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
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
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
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
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  hiddenServiceCard: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  hiddenText: {
    color: colors.textSecondary,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  editForm: {
    gap: 16,
  },
  editInputGroup: {
    gap: 6,
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
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
});
