
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
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/25340159/u8h7rt7/";
const SUPABASE_URL = "https://vvqlpbydvugqrbeftckc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cWxwYnlkdnVncXJiZWZ0Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTU1OTksImV4cCI6MjA3ODQ5MTU5OX0.qo3MERO4p1H7eLpkV5_OiWMBM1OdbFKpw-10wo8rIuU";

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
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as MM/DD/YYYY
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

    // Validate all required inputs (excluding jobDescription and preferredDate)
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

    // Validate zipcode is 5 digits
    if (zipcode.length !== 5) {
      console.log("ERROR: Invalid zipcode length:", zipcode);
      Alert.alert("Invalid Input", "Please enter a valid 5-digit zipcode.");
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
        serviceType: selectedService === "duct_cleaning" ? "Duct Cleaning" : "Duct Clean & Seal",
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

    // Send to Zapier webhook and Supabase email function
    setIsSubmitting(true);
    console.log("Sending to Zapier webhook:", ZAPIER_WEBHOOK_URL);
    
    let zapierSuccess = false;
    let emailSuccess = false;
    
    try {
      // Send to Zapier webhook
      console.log("Making fetch request to Zapier...");
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
        console.log("Status Text:", zapierResponse.statusText);
        console.log("OK:", zapierResponse.ok);
        
        // Try to read response body
        let zapierResponseText = "";
        try {
          zapierResponseText = await zapierResponse.text();
          console.log("Zapier Response Body:", zapierResponseText);
        } catch (textError) {
          console.log("Could not read Zapier response text:", textError);
        }
        
        if (!zapierResponse.ok) {
          console.error('❌ Zapier webhook returned error');
          console.error('Status:', zapierResponse.status);
          console.error('Response:', zapierResponseText);
        } else {
          console.log('✅ Successfully sent to Zapier');
          zapierSuccess = true;
        }
      } catch (zapierError) {
        console.error('❌ Error sending to Zapier:', zapierError);
        console.error('Zapier error details:', zapierError instanceof Error ? zapierError.message : String(zapierError));
      }

      // Send email via Supabase Edge Function using direct fetch
      console.log("Sending email via Supabase Edge Function...");
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
        console.log("Status Text:", emailResponse.statusText);
        console.log("OK:", emailResponse.ok);

        let emailResponseData;
        try {
          const emailResponseText = await emailResponse.text();
          console.log("Email Response Body:", emailResponseText);
          emailResponseData = JSON.parse(emailResponseText);
        } catch (parseError) {
          console.log("Could not parse email response:", parseError);
        }

        if (!emailResponse.ok) {
          console.error('❌ Error sending email:', emailResponseData);
          console.log('⚠️ Email failed but continuing with submission');
        } else {
          console.log('✅ Email sent successfully:', emailResponseData);
          emailSuccess = true;
        }
      } catch (emailError) {
        console.error('❌ Exception sending email:', emailError);
        console.error('Email exception details:', emailError instanceof Error ? emailError.message : String(emailError));
        console.log('⚠️ Email failed but continuing with submission');
      }

      // Show success if at least Zapier succeeded OR email succeeded
      if (zapierSuccess || emailSuccess) {
        console.log('✅ Job request submitted successfully');
        console.log('Zapier Success:', zapierSuccess);
        console.log('Email Success:', emailSuccess);
        
        if (!zapierSuccess && emailSuccess) {
          console.log('⚠️ Note: Zapier submission may not have succeeded, but email was sent');
        } else if (zapierSuccess && !emailSuccess) {
          console.log('⚠️ Note: Email notification may not have been sent, but Zapier succeeded');
        }
        
        setShowThankYouModal(true);
      } else {
        // Both failed
        console.error('❌ Both Zapier and Email submissions failed');
        Alert.alert(
          "Submission Error",
          "There was an issue submitting the job request. Both Zapier and email delivery failed. Please try again or contact support.\n\nIf the problem persists, you can manually send the information to agoins@refreshductcleaning.com",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error during submission:');
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
      console.log("Zapier Success:", zapierSuccess);
      console.log("Email Success:", emailSuccess);
    }
  };

  const resetForm = () => {
    console.log("Resetting form");
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
        keyboardShouldPersistTaps="handled"
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

        {/* Enhanced Technician Banner with Clear Labeling */}
        <View style={styles.technicianSection}>
          <View style={styles.technicianSectionHeader}>
            <IconSymbol 
              ios_icon_name="person.badge.shield.checkmark.fill" 
              android_material_icon_name="verified_user" 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.technicianSectionTitle}>YOUR INFORMATION (PRE-FILLED)</Text>
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
                size={56} 
                color={colors.primary} 
              />
            )}
            <View style={styles.technicianInfo}>
              <View style={styles.technicianInfoRow}>
                <IconSymbol 
                  ios_icon_name="person.fill" 
                  android_material_icon_name="person" 
                  size={16} 
                  color={colors.textSecondary} 
                />
                <Text style={styles.technicianLabel}>Technician:</Text>
                <Text style={styles.technicianName}>
                  {technicianInfo.firstName} {technicianInfo.lastName}
                </Text>
              </View>
              <View style={styles.technicianInfoRow}>
                <IconSymbol 
                  ios_icon_name="building.2.fill" 
                  android_material_icon_name="business" 
                  size={16} 
                  color={colors.textSecondary} 
                />
                <Text style={styles.technicianLabel}>Company:</Text>
                <Text style={styles.technicianCompany}>
                  {technicianInfo.companyName}
                </Text>
              </View>
              <View style={styles.technicianInfoRow}>
                <IconSymbol 
                  ios_icon_name="phone.fill" 
                  android_material_icon_name="phone" 
                  size={16} 
                  color={colors.textSecondary} 
                />
                <Text style={styles.technicianLabel}>Phone:</Text>
                <Text style={styles.technicianPhone}>
                  {technicianInfo.phoneNumber}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.technicianNote}>
            <IconSymbol 
              ios_icon_name="lock.fill" 
              android_material_icon_name="lock" 
              size={16} 
              color={colors.accent} 
            />
            <Text style={styles.technicianNoteText}>
              This is your technician information. It will be included with the job request for dispatching purposes.
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

          {/* Customer Information Section with Clear Notice */}
          <View style={styles.customerSectionHeader}>
            <View style={styles.customerHeaderTop}>
              <IconSymbol 
                ios_icon_name="person.crop.square.fill" 
                android_material_icon_name="contact_page" 
                size={24} 
                color={colors.secondary} 
              />
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
                Enter the CUSTOMER&apos;S contact information below (NOT your technician info). This is for dispatching the service to the customer&apos;s location.
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
            Your information and the booking information will be sent to agoins@refreshductcleaning.com
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
              The information has been sent and an email notification has been sent to agoins@refreshductcleaning.com.
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
  technicianSection: {
    marginBottom: 24,
  },
  technicianSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  technicianSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  technicianBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 3,
    borderColor: colors.primary,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.12)',
    elevation: 4,
  },
  profilePicture: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  technicianInfo: {
    flex: 1,
    gap: 8,
  },
  technicianInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  technicianLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 80,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  technicianCompany: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  technicianPhone: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  technicianNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.highlight,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  technicianNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
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
