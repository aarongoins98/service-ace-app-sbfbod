
import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { GlassView } from "expo-glass-effect";
import { colors } from "@/styles/commonStyles";
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";
import { IconSymbol } from "@/components/IconSymbol";
import { getUserData, saveUserData, clearUserData, TechnicianInfo } from "@/utils/userStorage";
import { supabase } from "@/app/integrations/supabase/client";

interface Company {
  id: string;
  name: string;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  
  // Validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  
  // Company picker
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  useEffect(() => {
    loadUserData();
    loadCompanies();
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
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const data = await getUserData();
      if (data) {
        setTechnicianInfo(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(formatPhoneNumber(data.phone));
        setCompanyName(data.companyName);
        setSelectedCompanyId(data.companyId || "");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeFirstLetter = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
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
    setPhone(formatted);
    
    if (formatted) {
      const digits = getPhoneDigits(formatted);
      if (!validatePhone(digits)) {
        setPhoneError("Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const validatePhone = (phone: string): boolean => {
    const digits = getPhoneDigits(phone);
    return digits.length === 10;
  };

  const handleSave = async () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert("Missing Information", "Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Missing Information", "Please enter your last name.");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Missing Information", "Please enter your email.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Missing Information", "Please enter your phone number.");
      return;
    }

    const phoneDigits = getPhoneDigits(phone);
    if (!validatePhone(phoneDigits)) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    if (!companyName.trim()) {
      Alert.alert("Missing Information", "Please select a company.");
      return;
    }

    try {
      setIsSaving(true);
      
      const userData: TechnicianInfo = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phoneDigits,
        companyName: companyName.trim(),
        companyId: selectedCompanyId,
      };

      await saveUserData(userData);
      setTechnicianInfo(userData);
      setIsEditing(false);
      
      Alert.alert("Success", "Your profile has been updated!");
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (technicianInfo) {
      setFirstName(technicianInfo.firstName);
      setLastName(technicianInfo.lastName);
      setEmail(technicianInfo.email);
      setPhone(formatPhoneNumber(technicianInfo.phone));
      setCompanyName(technicianInfo.companyName);
      setSelectedCompanyId(technicianInfo.companyId || "");
      setEmailError("");
      setPhoneError("");
    }
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? Your information will be cleared.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await clearUserData();
              setTechnicianInfo(null);
              setFirstName("");
              setLastName("");
              setEmail("");
              setPhone("");
              setCompanyName("");
              setSelectedCompanyId("");
              router.replace("/(tabs)/login");
            } catch (error) {
              console.error("Error during logout:", error);
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

  if (!technicianInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyState}>
            <IconSymbol 
              ios_icon_name="person.crop.circle.badge.exclamationmark" 
              android_material_icon_name="person_add" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyTitle}>No Profile Found</Text>
            <Text style={styles.emptyDescription}>
              Please login to view and edit your profile
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push("/(tabs)/login")}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
          <View style={styles.avatarContainer}>
            <IconSymbol 
              ios_icon_name="person.circle.fill" 
              android_material_icon_name="account_circle" 
              size={80} 
              color={colors.primary} 
            />
          </View>
          <Text style={styles.headerName}>
            {technicianInfo.firstName} {technicianInfo.lastName}
          </Text>
          <Text style={styles.headerCompany}>{technicianInfo.companyName}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!isEditing && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleStartEditing}
                activeOpacity={0.8}
              >
                <IconSymbol 
                  ios_icon_name="pencil.circle.fill" 
                  android_material_icon_name="edit" 
                  size={24} 
                  color={colors.primary} 
                />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <GlassView style={styles.card} tint="light">
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={handleFirstNameChange}
                  placeholder="Enter first name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              ) : (
                <Text style={styles.value}>{technicianInfo.firstName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={handleLastNameChange}
                  placeholder="Enter last name"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                />
              ) : (
                <Text style={styles.value}>{technicianInfo.lastName}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.input, emailError ? styles.inputError : null]}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="Enter email"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.value}>{technicianInfo.email}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone</Text>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.input, phoneError ? styles.inputError : null]}
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="(555) 555-5555"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                  {phoneError ? (
                    <Text style={styles.errorText}>{phoneError}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.value}>{formatPhoneNumber(technicianInfo.phone)}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Company</Text>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.companySelector}
                  onPress={() => setShowCompanyPicker(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.companySelectorText, !companyName && styles.companySelectorPlaceholder]}>
                    {companyName || "Select a company"}
                  </Text>
                  <IconSymbol 
                    ios_icon_name="chevron.down" 
                    android_material_icon_name="arrow_drop_down" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              ) : (
                <Text style={styles.value}>{technicianInfo.companyName}</Text>
              )}
            </View>
          </GlassView>

          {isEditing && (
            <View style={styles.actionButtons}>
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
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Admin Login Link */}
        <View style={styles.adminSection}>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => router.push("/(tabs)/adminLogin")}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="lock.shield.fill" 
              android_material_icon_name="admin_panel_settings" 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.adminButtonText}>Admin Login</Text>
            <IconSymbol 
              ios_icon_name="chevron.right" 
              android_material_icon_name="chevron_right" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.logoutSection}>
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
            
            {isLoadingCompanies ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <ScrollView style={styles.modalScroll}>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.companyOption,
                      selectedCompanyId === company.id && styles.companyOptionSelected
                    ]}
                    onPress={() => {
                      setCompanyName(company.name);
                      setSelectedCompanyId(company.id);
                      setShowCompanyPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.companyOptionText,
                      selectedCompanyId === company.id && styles.companyOptionTextSelected
                    ]}>
                      {company.name}
                    </Text>
                    {selectedCompanyId === company.id && (
                      <IconSymbol 
                        ios_icon_name="checkmark.circle.fill" 
                        android_material_icon_name="check_circle" 
                        size={24} 
                        color={colors.primary} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 120,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  headerName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerCompany: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 20,
    overflow: 'hidden',
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  value: {
    fontSize: 16,
    color: colors.text,
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
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  companySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  companySelectorText: {
    fontSize: 16,
    color: colors.text,
  },
  companySelectorPlaceholder: {
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  adminSection: {
    marginBottom: 16,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  adminButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 12,
  },
  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
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
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  companyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  companyOptionSelected: {
    backgroundColor: colors.card,
  },
  companyOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  companyOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
});
