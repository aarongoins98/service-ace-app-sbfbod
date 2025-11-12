
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
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveUserData, TechnicianInfo } from "@/utils/userStorage";
import { useRouter } from "expo-router";
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";
import { supabase } from "@/app/integrations/supabase/client";
import * as Haptics from "expo-haptics";

interface Company {
  id: string;
  name: string;
}

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("LoginScreen mounted");
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      console.log("Loading companies from Supabase...");
      setIsLoadingCompanies(true);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error loading companies:", error);
        Alert.alert("Error", "Failed to load company list. Please try again.");
        return;
      }

      setCompanies(data || []);
      console.log(`Loaded ${data?.length || 0} companies successfully`);
    } catch (error) {
      console.error("Exception while loading companies:", error);
      Alert.alert("Error", "An error occurred while loading companies.");
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  // Filter companies based on search query
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

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

  const handleLogin = async () => {
    console.log("=== LOGIN BUTTON PRESSED ===");
    console.log("Current form state:", {
      companyName,
      firstName,
      lastName,
      phoneNumber,
      email,
      isLoading
    });

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log("Haptics not available:", error);
    }
    
    // Validate inputs
    if (!companyName || !firstName || !lastName || !phoneNumber || !email) {
      console.log("Validation failed: Missing fields");
      Alert.alert("Missing Information", "Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      console.log("Validation failed: Invalid email format");
      setEmailError("Invalid email format. Please use format: xxx@xxx.xx");
      Alert.alert(
        "Invalid Email Format", 
        "The email address appears to be fake or incorrectly formatted. Please enter a valid email address in the format: xxx@xxx.xx\n\nExample: technician@company.com"
      );
      return;
    }

    if (!validatePhone(phoneNumber)) {
      console.log("Validation failed: Invalid phone number");
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    console.log("All validations passed, starting login process");
    setIsLoading(true);

    try {
      const userData: TechnicianInfo = {
        companyName,
        firstName,
        lastName,
        phoneNumber,
        email,
      };

      console.log("Saving user data:", userData);
      await saveUserData(userData);
      console.log("User data saved successfully");

      // Navigate to home page
      console.log("Navigating to home page");
      router.replace("/(tabs)/(home)/");
      
      // Show success message after navigation
      setTimeout(() => {
        Alert.alert(
          "Success!", 
          "Your information has been saved successfully."
        );
      }, 500);
      
      setIsLoading(false);
      console.log("Login process completed successfully");
    } catch (error) {
      console.error("Error during login process:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to save your information. Please try again.");
    }
  };

  const handleOpenCompanyPicker = () => {
    console.log("Opening company picker");
    setCompanySearchQuery("");
    setShowCompanyPicker(true);
  };

  const handleCloseCompanyPicker = () => {
    console.log("Closing company picker");
    setShowCompanyPicker(false);
    setCompanySearchQuery("");
  };

  const handleSelectCompany = (company: Company) => {
    console.log("Selected company:", company.name);
    setCompanyName(company.name);
    handleCloseCompanyPicker();
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
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.header}>
            <IconSymbol 
              ios_icon_name="person.crop.circle.badge.checkmark" 
              android_material_icon_name="how_to_reg" 
              size={72} 
              color={colors.primary} 
            />
            <Text style={styles.title}>Technician Login</Text>
            <Text style={styles.subtitle}>
              Enter your information to get started
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Name *</Text>
              {isLoadingCompanies ? (
                <View style={styles.loadingPicker}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading companies...</Text>
                </View>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.pickerButton,
                    pressed && styles.pickerButtonPressed
                  ]}
                  onPress={handleOpenCompanyPicker}
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
                </Pressable>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Technician Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor={colors.textSecondary}
                value={firstName}
                onChangeText={handleFirstNameChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor={colors.textSecondary}
                value={lastName}
                onChangeText={handleLastNameChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="(000)000-0000"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={13}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="technician@company.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={handleEmailChange}
                onBlur={handleEmailBlur}
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

            <Pressable 
              style={({ pressed }) => [
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
                pressed && !isLoading && styles.loginButtonPressed
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.loginButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Save & Continue</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.infoBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.secondary} 
            />
            <Text style={styles.infoText}>
              Your information will be saved locally on this device and included with all job request forms you submit.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Company Picker Modal */}
      <Modal
        visible={showCompanyPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseCompanyPicker}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalOverlayTouchable}
            onPress={handleCloseCompanyPicker}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <Pressable 
                onPress={handleCloseCompanyPicker}
                style={styles.modalCloseButton}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle.fill" 
                  android_material_icon_name="cancel" 
                  size={28} 
                  color={colors.textSecondary} 
                />
              </Pressable>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
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
                value={companySearchQuery}
                onChangeText={setCompanySearchQuery}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {companySearchQuery.length > 0 && (
                <Pressable 
                  onPress={() => setCompanySearchQuery("")}
                  style={styles.clearSearchButton}
                >
                  <IconSymbol 
                    ios_icon_name="xmark.circle.fill" 
                    android_material_icon_name="cancel" 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </Pressable>
              )}
            </View>

            <ScrollView 
              style={styles.modalList}
              keyboardShouldPersistTaps="always"
            >
              {filteredCompanies.length === 0 ? (
                <View style={styles.emptyCompanies}>
                  <IconSymbol 
                    ios_icon_name={companySearchQuery ? "magnifyingglass" : "building.2"} 
                    android_material_icon_name={companySearchQuery ? "search_off" : "business"} 
                    size={48} 
                    color={colors.textSecondary} 
                  />
                  <Text style={styles.emptyText}>
                    {companySearchQuery ? "No companies found" : "No companies available"}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {companySearchQuery 
                      ? `No results for "${companySearchQuery}"`
                      : "Contact your administrator to add companies"
                    }
                  </Text>
                </View>
              ) : (
                <React.Fragment>
                  {filteredCompanies.map((company) => (
                    <Pressable
                      key={company.id}
                      style={({ pressed }) => [
                        styles.companyOption,
                        companyName === company.name && styles.companyOptionSelected,
                        pressed && styles.companyOptionPressed
                      ]}
                      onPress={() => handleSelectCompany(company)}
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
                    </Pressable>
                  ))}
                </React.Fragment>
              )}
            </ScrollView>

            {/* Results count */}
            {companySearchQuery.length > 0 && filteredCompanies.length > 0 && (
              <View style={styles.resultsCount}>
                <Text style={styles.resultsCountText}>
                  {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} found
                </Text>
              </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 24,
    paddingBottom: 120,
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
  },
  formContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  pickerButtonPressed: {
    opacity: 0.7,
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
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingTop: 8,
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
  companyOptionPressed: {
    opacity: 0.7,
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
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
