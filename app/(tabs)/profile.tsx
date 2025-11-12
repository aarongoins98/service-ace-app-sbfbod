
import React, { useState, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";
import { getUserData, saveUserData, clearUserData, TechnicianInfo } from "@/utils/userStorage";
import { useRouter } from "expo-router";
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";
import { supabase } from "@/app/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [userData, setUserData] = useState<TechnicianInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error loading companies:", error);
        return;
      }

      setCompanies(data || []);
      console.log(`Loaded ${data?.length || 0} companies`);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const data = await getUserData();
      if (data) {
        setUserData(data);
        setCompanyName(data.companyName);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setPhoneNumber(data.phoneNumber);
        setEmail(data.email);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleFirstNameChange = (text: string) => {
    const capitalized = capitalizeFirstLetter(text);
    setFirstName(capitalized);
  };

  const handleLastNameChange = (text: string) => {
    const capitalized = capitalizeFirstLetter(text);
    setLastName(capitalized);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const validateEmail = (email: string) => {
    // Enhanced email validation regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    // Validate email when user leaves the field
    if (email && !validateEmail(email)) {
      setEmailError("Invalid email format. Please use format: xxx@xxx.xx");
    }
  };

  const validatePhone = (phone: string) => {
    const digits = getPhoneDigits(phone);
    return digits.length === 10;
  };

  const handleSave = async () => {
    if (!companyName || !firstName || !lastName || !phoneNumber || !email) {
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Invalid email format. Please use format: xxx@xxx.xx");
      Alert.alert(
        "Invalid Email Format", 
        "The email address appears to be fake or incorrectly formatted. Please enter a valid email address in the format: xxx@xxx.xx\n\nExample: technician@company.com"
      );
      return;
    }

    if (!validatePhone(phoneNumber)) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedData: TechnicianInfo = {
        companyName,
        firstName,
        lastName,
        phoneNumber,
        email,
      };
      
      await saveUserData(updatedData);
      setUserData(updatedData);
      setIsEditing(false);
      setEmailError("");
      
      Alert.alert(
        "Success", 
        "Your information has been updated.",
        [
          {
            text: "OK",
            onPress: () => {
              console.log("Profile saved, navigating to home");
              router.replace("/(tabs)/(home)/");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to save your information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setCompanyName(userData.companyName);
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      setPhoneNumber(userData.phoneNumber);
      setEmail(userData.email);
    }
    setEmailError("");
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    loadCompanies();
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? This will clear your saved information.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Logging out user...");
              await clearUserData();
              console.log("User data cleared, redirecting to login");
              router.replace("/(tabs)/login");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.emptyContainer}>
          <IconSymbol 
            ios_icon_name="person.crop.circle.badge.xmark" 
            android_material_icon_name="person_off" 
            size={80} 
            color={colors.textSecondary} 
          />
          <Text style={styles.emptyTitle}>No Profile Found</Text>
          <Text style={styles.emptyText}>Please login to continue</Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.replace("/(tabs)/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
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
          <Text style={styles.title}>Technician Profile</Text>
          <Text style={styles.subtitle}>
            {isEditing ? "Edit your information" : "Your account information"}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleStartEditing}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  ios_icon_name="pencil" 
                  android_material_icon_name="edit" 
                  size={18} 
                  color={colors.primary} 
                />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            {isEditing ? (
              <React.Fragment>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company Name</Text>
                  {isLoadingCompanies ? (
                    <View style={styles.loadingPicker}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingText}>Loading companies...</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => setShowCompanyPicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pickerButtonText, !companyName && styles.pickerPlaceholder]}>
                        {companyName || "Select a company"}
                      </Text>
                      <IconSymbol 
                        ios_icon_name="chevron.down" 
                        android_material_icon_name="arrow_drop_down" 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={handleFirstNameChange}
                    placeholder="First name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={handleLastNameChange}
                    placeholder="Last name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    placeholder="(000)000-0000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={13}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="Email address"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailError ? (
                    <View style={styles.errorContainer}>
                      <IconSymbol 
                        ios_icon_name="exclamationmark.triangle.fill" 
                        android_material_icon_name="warning" 
                        size={16} 
                        color={colors.error} 
                      />
                      <Text style={styles.errorText}>{emailError}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                    onPress={handleSave}
                    activeOpacity={0.8}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <View style={styles.infoRow}>
                  <IconSymbol 
                    ios_icon_name="building.2.fill" 
                    android_material_icon_name="business" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Company</Text>
                    <Text style={styles.infoValue}>{userData.companyName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol 
                    ios_icon_name="person.fill" 
                    android_material_icon_name="person" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>
                      {userData.firstName} {userData.lastName}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol 
                    ios_icon_name="phone.fill" 
                    android_material_icon_name="phone" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{userData.phoneNumber}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <IconSymbol 
                    ios_icon_name="envelope.fill" 
                    android_material_icon_name="email" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{userData.email}</Text>
                  </View>
                </View>
              </React.Fragment>
            )}
          </View>
        </View>

        <View style={styles.section}>
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

        <View style={styles.adminLinkContainer}>
          <TouchableOpacity 
            style={styles.adminLink} 
            onPress={() => router.push("/(tabs)/adminLogin")}
            activeOpacity={0.7}
          >
            <IconSymbol 
              ios_icon_name="lock.shield.fill" 
              android_material_icon_name="admin_panel_settings" 
              size={16} 
              color={colors.textSecondary} 
            />
            <Text style={styles.adminLinkText}>Admin Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Company Picker Modal */}
      <Modal
        visible={showCompanyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompanyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <TouchableOpacity 
                onPress={() => setShowCompanyPicker(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {companies.length === 0 ? (
                <View style={styles.emptyCompanies}>
                  <IconSymbol 
                    ios_icon_name="building.2" 
                    android_material_icon_name="business" 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>No companies available</Text>
                  <Text style={styles.emptySubtext}>Contact your administrator to add companies</Text>
                </View>
              ) : (
                companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.companyOption,
                      companyName === company.name && styles.companyOptionSelected
                    ]}
                    onPress={() => {
                      setCompanyName(company.name);
                      setShowCompanyPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol 
                      ios_icon_name="building.2.fill" 
                      android_material_icon_name="business" 
                      size={20} 
                      color={companyName === company.name ? colors.primary : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.companyOptionText,
                      companyName === company.name && styles.companyOptionTextSelected
                    ]}>
                      {company.name}
                    </Text>
                    {companyName === company.name && (
                      <IconSymbol 
                        ios_icon_name="checkmark.circle.fill" 
                        android_material_icon_name="check_circle" 
                        size={24} 
                        color={colors.primary} 
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
  },
  inputGroup: {
    marginBottom: 4,
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
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 14,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  adminLinkContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  adminLinkText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loadingPicker: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalList: {
    padding: 20,
  },
  companyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  companyOptionSelected: {
    backgroundColor: colors.background,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  companyOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  companyOptionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  emptyCompanies: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
