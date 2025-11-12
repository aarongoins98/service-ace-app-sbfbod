
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
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { getUserData, TechnicianInfo } from "@/utils/userStorage";
import { useRouter } from "expo-router";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/25340159/u8h7rt7/";

export default function JobRequestFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [isLoadingTechnician, setIsLoadingTechnician] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  
  // Property Information
  const [squareFootage, setSquareFootage] = useState("");
  const [hvacSystems, setHvacSystems] = useState("");
  
  // Customer Information
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  
  // Service Address
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  
  // Additional Details
  const [jobDescription, setJobDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");

  useEffect(() => {
    loadTechnicianInfo();
  }, []);

  const loadTechnicianInfo = async () => {
    setIsLoadingTechnician(true);
    try {
      const data = await getUserData();
      console.log("Loaded technician info:", data);
      setTechnicianInfo(data);
    } catch (error) {
      console.error("Error loading technician info:", error);
    } finally {
      setIsLoadingTechnician(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSubmit = async () => {
    console.log("=== JOB REQUEST SUBMISSION STARTED ===");
    console.log("Timestamp:", new Date().toISOString());
    
    // Check if user is logged in FIRST
    if (!technicianInfo) {
      console.log("ERROR: No technician info available - Login required");
      Alert.alert(
        "Login Required",
        "You must be logged in to submit a job request. Please login first.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Go to Login",
            onPress: () => router.push("/(tabs)/login"),
          },
        ]
      );
      return;
    }

    console.log("Technician Info:", JSON.stringify(technicianInfo, null, 2));

    // Validate all required inputs
    if (!squareFootage || !hvacSystems || !customerFirstName || !customerLastName || 
        !phone || !email || !streetAddress || !city || !state || !zipcode) {
      console.log("ERROR: Missing required fields");
      console.log("Field values:", {
        squareFootage,
        hvacSystems,
        customerFirstName,
        customerLastName,
        phone,
        email,
        streetAddress,
        city,
        state,
        zipcode
      });
      Alert.alert("Missing Information", "Please fill in all required fields.");
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
      console.log("ERROR: Invalid email:", email);
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!validatePhone(phone)) {
      console.log("ERROR: Invalid phone:", phone);
      Alert.alert("Invalid Phone", "Please enter a valid phone number (at least 10 digits).");
      return;
    }

    console.log("All validations passed");

    // Prepare comprehensive data for Zapier webhook
    const jobData = {
      // Property Information
      propertyInformation: {
        squareFootage: sqFt,
        additionalHvacSystems: hvacCount,
        totalHvacSystems: hvacCount + 1,
      },
      
      // Customer Information
      customerInformation: {
        firstName: customerFirstName,
        lastName: customerLastName,
        fullName: `${customerFirstName} ${customerLastName}`,
        phone: phone,
        email: email,
      },
      
      // Service Address
      serviceAddress: {
        streetAddress: streetAddress,
        city: city,
        state: state,
        zipcode: zipcode,
        fullAddress: `${streetAddress}, ${city}, ${state} ${zipcode}`,
      },
      
      // Additional Details
      additionalDetails: {
        jobDescription: jobDescription || "Duct cleaning service requested",
        preferredDate: preferredDate || "Not specified",
      },
      
      // Technician Information (who submitted the request)
      technicianInformation: {
        companyName: technicianInfo.companyName,
        firstName: technicianInfo.firstName,
        lastName: technicianInfo.lastName,
        fullName: `${technicianInfo.firstName} ${technicianInfo.lastName}`,
        phoneNumber: technicianInfo.phoneNumber,
        email: technicianInfo.email,
      },
      
      // Metadata
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

    // Send to Zapier webhook
    setIsSubmitting(true);
    console.log("Sending to Zapier webhook:", ZAPIER_WEBHOOK_URL);
    
    try {
      console.log("Making fetch request...");
      const response = await fetch(ZAPIER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      
      console.log("Response received:");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      console.log("OK:", response.ok);
      
      // Try to read response body
      let responseText = "";
      try {
        responseText = await response.text();
        console.log("Response Body:", responseText);
      } catch (textError) {
        console.log("Could not read response text:", textError);
      }
      
      if (response.ok) {
        console.log('✅ Successfully sent to Zapier');
        // Show thank you modal
        setShowThankYouModal(true);
      } else {
        console.error('❌ Zapier webhook returned error');
        console.error('Status:', response.status);
        console.error('Response:', responseText);
        Alert.alert(
          "Submission Error",
          `There was an issue submitting the job request (Status: ${response.status}). Please try again or contact support.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('❌ Error sending to Zapier:');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Full error:', error);
      
      Alert.alert(
        "Network Error",
        `Unable to submit job request. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and try again.`,
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
      console.log("=== JOB REQUEST SUBMISSION ENDED ===");
    }
  };

  const resetForm = () => {
    console.log("Resetting form");
    setSquareFootage("");
    setHvacSystems("");
    setCustomerFirstName("");
    setCustomerLastName("");
    setPhone("");
    setEmail("");
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

  if (isLoadingTechnician) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show login required screen if not logged in
  if (!technicianInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loginRequiredContainer}>
          <IconSymbol 
            ios_icon_name="lock.circle.fill" 
            android_material_icon_name="lock" 
            size={80} 
            color={colors.primary} 
          />
          <Text style={styles.loginRequiredTitle}>Login Required</Text>
          <Text style={styles.loginRequiredText}>
            You must be logged in to submit job requests. Please login with your technician information to continue.
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push("/(tabs)/login")}
            activeOpacity={0.8}
          >
            <IconSymbol 
              ios_icon_name="person.crop.circle.badge.checkmark" 
              android_material_icon_name="how_to_reg" 
              size={20} 
              color="#ffffff" 
            />
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
          <Image 
            source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Job Request Form</Text>
          <View style={styles.noticeBox}>
            <IconSymbol 
              ios_icon_name="info.circle.fill" 
              android_material_icon_name="info" 
              size={20} 
              color={colors.secondary} 
            />
            <Text style={styles.noticeText}>
              Refresh Duct Cleaning will reach out to the customer to schedule at our soonest availability.
            </Text>
          </View>
        </View>

        <View style={styles.technicianBanner}>
          {technicianInfo.profilePictureUri ? (
            <Image 
              source={{ uri: technicianInfo.profilePictureUri }} 
              style={styles.profilePicture}
            />
          ) : (
            <IconSymbol 
              ios_icon_name="person.crop.circle.fill" 
              android_material_icon_name="account_circle" 
              size={48} 
              color={colors.primary} 
            />
          )}
          <View style={styles.technicianInfo}>
            <Text style={styles.technicianName}>
              {technicianInfo.firstName} {technicianInfo.lastName}
            </Text>
            <Text style={styles.technicianCompany}>
              {technicianInfo.companyName}
            </Text>
          </View>
        </View>

        <View style={styles.formContainer}>
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
              editable={!isSubmitting}
            />
            <Text style={styles.helperText}>
              Enter 0 if only 1 HVAC system
            </Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer first name"
              placeholderTextColor={colors.textSecondary}
              value={customerFirstName}
              onChangeText={setCustomerFirstName}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer last name"
              placeholderTextColor={colors.textSecondary}
              value={customerLastName}
              onChangeText={setCustomerLastName}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="customer@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
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
              onChangeText={setPreferredDate}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </>
            ) : (
              <>
                <IconSymbol 
                  ios_icon_name="paperplane.fill" 
                  android_material_icon_name="send" 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.submitButtonText}>Submit Job Request</Text>
              </>
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
            Your technician information will be automatically included with this job request. The data will be sent to Housecall Pro via Zapier and an email notification will be sent to agoins@refreshductcleaning.com.
          </Text>
        </View>

        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>🔍 Debugging Information</Text>
          <Text style={styles.debugText}>
            Webhook URL: {ZAPIER_WEBHOOK_URL}
          </Text>
          <Text style={styles.debugText}>
            Check your console logs for detailed submission data.
          </Text>
          <Text style={styles.debugText}>
            All form data and API responses are logged.
          </Text>
        </View>
      </ScrollView>

      {/* Thank You Modal */}
      <Modal
        visible={showThankYouModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseThankYou}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={80} 
                color={colors.success} 
              />
            </View>
            <Text style={styles.modalTitle}>Thank You!</Text>
            <Text style={styles.modalSubtitle}>
              Your job request has been submitted successfully
            </Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalText}>
              The information has been sent to Housecall Pro and an email notification has been sent to agoins@refreshductcleaning.com.
            </Text>
            <Text style={styles.modalText}>
              Refresh Duct Cleaning will reach out to the customer to schedule at our soonest availability.
            </Text>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleCloseThankYou}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Submit Another Request</Text>
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
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loginRequiredTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginRequiredText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
    marginBottom: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: colors.secondary,
    width: '100%',
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  technicianBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  technicianCompany: {
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 24,
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
  debugBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#0c4a6e',
    marginBottom: 4,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
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
  modalText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
