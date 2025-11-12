
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
  Image,
  Modal,
  Pressable,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";
import { supabase } from "@/app/integrations/supabase/client";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/25340159/u8h7rt7/";
const SUPABASE_URL = "https://vvqlpbydvugqrbeftckc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cWxwYnlkdnVncXJiZWZ0Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTU1OTksImV4cCI6MjA3ODQ5MTU5OX0.qo3MERO4p1H7eLpkV5_OiWMBM1OdbFKpw-10wo8rIuU";

interface Company {
  id: string;
  name: string;
}

export default function JobRequestFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  
  // Company Selection
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  
  // Property Information
  const [squareFootage, setSquareFootage] = useState("");
  const [hvacSystems, setHvacSystems] = useState("");
  const [selectedService, setSelectedService] = useState<"duct_cleaning" | "duct_clean_seal">("duct_cleaning");
  
  // Customer Information
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  
  // Service Address
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  
  // Additional Details
  const [jobDescription, setJobDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  useEffect(() => {
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

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleFirstNameChange = (text: string) => {
    const capitalized = capitalizeFirstLetter(text);
    setCustomerFirstName(capitalized);
  };

  const handleLastNameChange = (text: string) => {
    const capitalized = capitalizeFirstLetter(text);
    setCustomerLastName(capitalized);
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const formatDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = cleaned.substring(0, 2);
      if (cleaned.length >= 3) {
        formatted += '/' + cleaned.substring(2, 4);
      }
      if (cleaned.length >= 5) {
        formatted += '/' + cleaned.substring(4, 8);
      }
    }
    
    return formatted;
  };

  const handlePreferredDateChange = (text: string) => {
    const formatted = formatDate(text);
    setPreferredDate(formatted);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) {
      setEmailError("");
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError("Invalid email format. Please use format: xxx@xxx.xx");
    }
  };

  const validatePhone = (phone: string) => {
    const digits = getPhoneDigits(phone);
    return digits.length === 10;
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
    setSelectedCompanyId(company.id);
    handleCloseCompanyPicker();
  };

  const handleSubmit = async () => {
    console.log("=== JOB REQUEST SUBMISSION STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    // Validate all required inputs
    if (!companyName || !squareFootage || !hvacSystems || !customerFirstName || !customerLastName || 
        !phone || !email || !streetAddress || !city || !state || !zipcode) {
      console.log("ERROR: Missing required fields");
      Alert.alert("Missing Information", "Please fill in all required fields. Job Description and Preferred Date are optional.");
      return;
    }

    const sqFt = parseFloat(squareFootage);
    if (isNaN(sqFt) || sqFt < 0) {
      console.log("ERROR: Invalid square footage:", squareFootage);
      Alert.alert("Invalid Input", "Please enter a valid square footage (0 or greater).");
      return;
    }

    const hvacCount = parseInt(hvacSystems);
    if (isNaN(hvacCount) || hvacCount < 0) {
      console.log("ERROR: Invalid HVAC count:", hvacSystems);
      Alert.alert("Invalid Input", "Please enter a valid number of additional HVAC systems (0 or greater).");
      return;
    }

    if (!validateEmail(email)) {
      console.log("ERROR: Invalid email format:", email);
      setEmailError("Invalid email format. Please use format: xxx@xxx.xx");
      Alert.alert(
        "Invalid Email Format", 
        "The email address appears to be fake or incorrectly formatted. Please enter a valid email address in the format: xxx@xxx.xx\n\nExample: customer@example.com"
      );
      return;
    }

    if (!validatePhone(phone)) {
      console.log("ERROR: Invalid phone:", phone);
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number.");
      return;
    }

    if (zipcode.length !== 5) {
      console.log("ERROR: Invalid zipcode length:", zipcode);
      Alert.alert("Invalid Input", "Please enter a valid 5-digit zipcode.");
      return;
    }

    console.log("All validations passed");

    const jobData = {
      propertyInformation: {
        squareFootage: sqFt,
        additionalHvacSystems: hvacCount,
        totalHvacSystems: hvacCount + 1,
        serviceType: selectedService === "duct_cleaning" ? "Duct Cleaning" : "Duct Clean & Seal",
      },
      
      customerInformation: {
        firstName: customerFirstName,
        lastName: customerLastName,
        fullName: `${customerFirstName} ${customerLastName}`,
        phone: phone,
        email: email,
      },
      
      serviceAddress: {
        streetAddress: streetAddress,
        city: city,
        state: state,
        zipcode: zipcode,
        fullAddress: `${streetAddress}, ${city}, ${state} ${zipcode}`,
      },
      
      additionalDetails: {
        jobDescription: jobDescription || "Duct cleaning service requested",
        preferredDate: preferredDate || "Not specified",
      },
      
      companyInformation: {
        companyName: companyName,
        companyId: selectedCompanyId,
      },
      
      metadata: {
        submittedAt: new Date().toISOString(),
        submittedDate: new Date().toLocaleDateString(),
        submittedTime: new Date().toLocaleTimeString(),
        notificationEmail: "agoins@refreshductcleaning.com",
      },
    };

    console.log("=== COMPLETE JOB REQUEST DATA ===");
    console.log(JSON.stringify(jobData, null, 2));
    console.log("=== END JOB REQUEST DATA ===");

    setIsSubmitting(true);
    console.log("Sending to Zapier webhook:", ZAPIER_WEBHOOK_URL);
    
    let zapierSuccess = false;
    let emailSuccess = false;
    
    try {
      try {
        const zapierResponse = await fetch(ZAPIER_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jobData),
        });
        
        console.log("Zapier Response received:");
        console.log("Status:", zapierResponse.status);
        console.log("OK:", zapierResponse.ok);
        
        if (!zapierResponse.ok) {
          console.error('❌ Zapier webhook returned error');
        } else {
          console.log('✅ Successfully sent to Zapier');
          zapierSuccess = true;
        }
      } catch (zapierError) {
        console.error('❌ Error sending to Zapier:', zapierError);
      }

      try {
        const emailResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/send-job-request-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify(jobData),
          }
        );

        console.log("Email Response received:");
        console.log("Status:", emailResponse.status);
        console.log("OK:", emailResponse.ok);

        if (!emailResponse.ok) {
          console.error('❌ Error sending email');
        } else {
          console.log('✅ Email sent successfully');
          emailSuccess = true;
        }
      } catch (emailError) {
        console.error('❌ Exception sending email:', emailError);
      }

      if (zapierSuccess || emailSuccess) {
        console.log('✅ Job request submitted successfully');
        setShowThankYouModal(true);
      } else {
        console.error('❌ Both Zapier and Email submissions failed');
        Alert.alert(
          "Submission Error",
          "There was an issue submitting the job request. Please try again or contact support.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error during submission:', error);
      Alert.alert(
        "Network Error",
        `Unable to submit job request. Please check your internet connection and try again.`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
      console.log("=== JOB REQUEST SUBMISSION ENDED ===");
    }
  };

  const resetForm = () => {
    console.log("Resetting form");
    setCompanyName("");
    setSelectedCompanyId("");
    setSquareFootage("");
    setHvacSystems("");
    setSelectedService("duct_cleaning");
    setCustomerFirstName("");
    setCustomerLastName("");
    setPhone("");
    setEmail("");
    setEmailError("");
    setStreetAddress("");
    setCity("");
    setState("");
    setZipcode("");
    setJobDescription("");
    setPreferredDate("");
    setShowThankYouModal(false);
  };

  const handleCloseThankYou = () => {
    setShowThankYouModal(false);
    resetForm();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Job Request Form</Text>
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
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={handleOpenCompanyPicker}
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

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Property Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Square Footage *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter home square footage (e.g., 1500)"
              placeholderTextColor={colors.textSecondary}
              value={squareFootage}
              onChangeText={setSquareFootage}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
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
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
            <Text style={styles.helperText}>
              Enter 0 if only 1 HVAC system
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Type *</Text>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setSelectedService("duct_cleaning")}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <View style={styles.checkbox}>
                  {selectedService === "duct_cleaning" && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Duct Cleaning</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => setSelectedService("duct_clean_seal")}
                activeOpacity={0.7}
                disabled={isSubmitting}
              >
                <View style={styles.checkbox}>
                  {selectedService === "duct_clean_seal" && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Duct Clean & Seal</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.customerSectionHeader}>
            <View style={styles.customerHeaderTop}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
            </View>
            <View style={styles.customerNotice}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning" 
                size={18} 
                color={colors.warning || '#FF9500'} 
              />
              <Text style={styles.customerNoticeText}>
                Enter the CUSTOMER&apos;S contact information below. This is for dispatching the service to the customer&apos;s location.
              </Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer first name"
              placeholderTextColor={colors.textSecondary}
              value={customerFirstName}
              onChangeText={handleFirstNameChange}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer last name"
              placeholderTextColor={colors.textSecondary}
              value={customerLastName}
              onChangeText={handleLastNameChange}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="(000)000-0000"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
              maxLength={13}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Email Address *</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="customer@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
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

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Service Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main Street"
              placeholderTextColor={colors.textSecondary}
              value={streetAddress}
              onChangeText={setStreetAddress}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter city"
              placeholderTextColor={colors.textSecondary}
              value={city}
              onChangeText={setCity}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter state (e.g., UT)"
              placeholderTextColor={colors.textSecondary}
              value={state}
              onChangeText={setState}
              autoCapitalize="characters"
              maxLength={2}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
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
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Additional Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes or special requests..."
              placeholderTextColor={colors.textSecondary}
              value={jobDescription}
              onChangeText={setJobDescription}
              multiline
              numberOfLines={4}
              returnKeyType="default"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={colors.textSecondary}
              value={preferredDate}
              onChangeText={handlePreferredDateChange}
              keyboardType="numeric"
              returnKeyType="done"
              blurOnSubmit={true}
              editable={!isSubmitting}
              maxLength={10}
            />
            <Text style={styles.helperText}>
              Format: MM/DD/YYYY (e.g., 12/25/2024)
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <React.Fragment>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <IconSymbol 
                  ios_icon_name="paperplane.fill" 
                  android_material_icon_name="send" 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.submitButtonText}>Submit Job Request</Text>
              </React.Fragment>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.accent} 
          />
          <Text style={styles.infoText}>
            The booking information will be sent to agoins@refreshductcleaning.com
          </Text>
        </View>
      </ScrollView>

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

      {/* Thank You Modal */}
      <Modal
        visible={showThankYouModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseThankYou}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.thankYouModalContent}>
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={80} 
                color={colors.success} 
              />
            </View>
            <Text style={styles.thankYouModalTitle}>Thank You!</Text>
            <Text style={styles.thankYouModalSubtitle}>
              Your job request has been submitted successfully
            </Text>
            <View style={styles.modalDivider} />
            <Text style={styles.thankYouModalText}>
              The information has been sent and an email notification has been sent to agoins@refreshductcleaning.com.
            </Text>
            <Text style={styles.thankYouModalText}>
              Refresh Duct Cleaning will reach out to the customer to schedule at our soonest availability.
            </Text>
            <TouchableOpacity 
              style={styles.thankYouModalButton} 
              onPress={handleCloseThankYou}
              activeOpacity={0.8}
            >
              <Text style={styles.thankYouModalButtonText}>Submit Another Request</Text>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 8,
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
  customerSectionHeader: {
    marginBottom: 20,
  },
  customerHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  customerNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 14,
    gap: 10,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  customerNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    lineHeight: 20,
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    gap: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
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
  pickerButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerPlaceholder: {
    color: colors.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
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
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
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
  thankYouModalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    margin: 24,
    alignItems: 'center',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  thankYouModalTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  thankYouModalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  thankYouModalText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  thankYouModalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  thankYouModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
