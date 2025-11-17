
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
import { useRouter } from "expo-router";
import { formatPhoneNumber, getPhoneDigits } from "@/utils/phoneFormatter";
import { supabase } from "@/app/integrations/supabase/client";

const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/25340159/u8h7rt7/";
const SUPABASE_URL = "https://vvqlpbydvugqrbeftckc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cWxwYnlkdnVncXJiZWZ0Y2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTU1OTksImV4cCI6MjA3ODQ5MTU5OX0.qo3MERO4p1H7eLpkV5_OiWMBM1OdbFKpw-10wo8rIuU";

interface AddOnService {
  id: string;
  service_name: string;
  price: number;
  description: string;
  enabled: boolean;
  quantity: number;
}

export default function JobRequestFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  
  // Company Name (simple text field)
  const [companyName, setCompanyName] = useState("");
  
  // Submitter Information
  const [submitterName, setSubmitterName] = useState("");
  
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

  // Add-On Services
  const [addOnServices, setAddOnServices] = useState<AddOnService[]>([]);

  useEffect(() => {
    loadAddOnServices();
  }, []);

  const loadAddOnServices = async () => {
    try {
      console.log("Loading add-on services from Supabase...");
      
      const { data, error } = await supabase
        .from('service_prices')
        .select('*')
        .in('service_name', [
          'dryer_vent',
          'anti_microbial_fogging',
          'evap_coil_cleaning',
          'outdoor_coil_cleaning',
          'bathroom_fan_cleaning'
        ]);

      if (error) {
        console.error("Error loading add-on services:", error);
        return;
      }

      const services: AddOnService[] = (data || []).map(item => ({
        id: item.id,
        service_name: item.service_name,
        price: parseFloat(item.price),
        description: item.description,
        enabled: false,
        quantity: 1,
      }));

      setAddOnServices(services);
      console.log(`Loaded ${services.length} add-on services`);
    } catch (error) {
      console.error("Error loading add-on services:", error);
    }
  };

  const toggleAddOn = (serviceId: string) => {
    setAddOnServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, enabled: !service.enabled }
          : service
      )
    );
  };

  const updateAddOnQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) return;
    setAddOnServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, quantity }
          : service
      )
    );
  };

  const getAddOnDisplayName = (serviceName: string): string => {
    const names: { [key: string]: string } = {
      'dryer_vent': 'Dryer Vent',
      'anti_microbial_fogging': 'Anti-Microbial Fogging',
      'evap_coil_cleaning': 'In-place Evap Coil Cleaning',
      'outdoor_coil_cleaning': 'Outdoor Coil Cleaning',
      'bathroom_fan_cleaning': 'Bathroom Fan Cleaning',
    };
    return names[serviceName] || serviceName;
  };

  const getAddOnIcon = (serviceName: string): { ios: string; android: string } => {
    const icons: { [key: string]: { ios: string; android: string } } = {
      'dryer_vent': { ios: 'wind', android: 'air' },
      'anti_microbial_fogging': { ios: 'sparkles', android: 'auto_awesome' },
      'evap_coil_cleaning': { ios: 'snowflake', android: 'ac_unit' },
      'outdoor_coil_cleaning': { ios: 'fan.fill', android: 'hvac' },
      'bathroom_fan_cleaning': { ios: 'fan.badge.automatic', android: 'mode_fan' },
    };
    return icons[serviceName] || { ios: 'plus.circle', android: 'add_circle' };
  };

  const capitalizeFirstLetter = (text: string): string => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const handleSubmitterNameChange = (text: string) => {
    const capitalized = capitalizeFirstLetter(text);
    setSubmitterName(capitalized);
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

  const handleSubmit = async () => {
    console.log("=== JOB REQUEST SUBMISSION STARTED ===");
    console.log("Timestamp:", new Date().toISOString());

    // Validate all required inputs
    if (!companyName || !submitterName || !squareFootage || !hvacSystems || !customerFirstName || !customerLastName || 
        !phone || !email || !streetAddress || !city || !state || !zipcode) {
      console.log("ERROR: Missing required fields");
      Alert.alert("Missing Information", "Please fill in all required fields. Job Description and Preferred Date are optional.");
      return;
    }

    // Validate company name is not empty or just whitespace
    if (companyName.trim().length === 0) {
      console.log("ERROR: Company name is empty");
      Alert.alert("Missing Information", "Please enter a company name.");
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

    // Prepare add-on services data
    const selectedAddOns = addOnServices
      .filter(service => service.enabled)
      .map(service => ({
        serviceName: getAddOnDisplayName(service.service_name),
        serviceId: service.service_name,
        quantity: service.quantity,
        pricePerUnit: service.price,
        totalPrice: service.price * service.quantity,
      }));

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
      
      addOnServices: selectedAddOns,
      
      technicianInformation: {
        fullName: submitterName,
        companyName: companyName.trim(),
        companyId: null,
        phoneNumber: "N/A",
        email: "N/A",
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
        console.log('Sending email via Supabase Edge Function...');
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
          const errorText = await emailResponse.text();
          console.error('❌ Error sending email. Response:', errorText);
        } else {
          const responseData = await emailResponse.json();
          console.log('✅ Email sent successfully:', responseData);
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
    setSubmitterName("");
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
    setAddOnServices(prev => prev.map(service => ({ ...service, enabled: false, quantity: 1 })));
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
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor={colors.textSecondary}
              value={companyName}
              onChangeText={setCompanyName}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Your Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={colors.textSecondary}
              value={submitterName}
              onChangeText={handleSubmitterNameChange}
              returnKeyType="next"
              blurOnSubmit={false}
              editable={!isSubmitting}
            />
            <Text style={styles.helperText}>
              This helps us identify who from the company submitted this request
            </Text>
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

          {/* Add-On Services Section */}
          {addOnServices.length > 0 && (
            <View style={styles.addOnsSection}>
              <Text style={styles.addOnsTitle}>Additional Services (Optional)</Text>
              <Text style={styles.addOnsSubtitle}>Select any additional services and specify quantity</Text>
              
              {addOnServices.map((service) => {
                const icon = getAddOnIcon(service.service_name);
                
                return (
                  <View key={service.id} style={styles.addOnItem}>
                    <TouchableOpacity 
                      style={styles.addOnCheckbox}
                      onPress={() => toggleAddOn(service.id)}
                      activeOpacity={0.7}
                      disabled={isSubmitting}
                    >
                      <View style={[
                        styles.checkbox,
                        service.enabled && styles.checkboxChecked
                      ]}>
                        {service.enabled && (
                          <IconSymbol 
                            ios_icon_name="checkmark" 
                            android_material_icon_name="check" 
                            size={16} 
                            color="#ffffff" 
                          />
                        )}
                      </View>
                      <View style={styles.addOnInfo}>
                        <View style={styles.addOnHeader}>
                          <IconSymbol 
                            ios_icon_name={icon.ios} 
                            android_material_icon_name={icon.android} 
                            size={20} 
                            color={service.enabled ? colors.primary : colors.textSecondary} 
                          />
                          <Text style={[
                            styles.addOnName,
                            service.enabled && styles.addOnNameActive
                          ]}>
                            {getAddOnDisplayName(service.service_name)}
                          </Text>
                        </View>
                        <Text style={styles.addOnPrice}>
                          ${service.price.toFixed(2)} each
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {service.enabled && (
                      <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Quantity:</Text>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateAddOnQuantity(service.id, service.quantity - 1)}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                          >
                            <IconSymbol 
                              ios_icon_name="minus" 
                              android_material_icon_name="remove" 
                              size={16} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                          <Text style={styles.quantityValue}>{service.quantity}</Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => updateAddOnQuantity(service.id, service.quantity + 1)}
                            activeOpacity={0.7}
                            disabled={isSubmitting}
                          >
                            <IconSymbol 
                              ios_icon_name="plus" 
                              android_material_icon_name="add" 
                              size={16} 
                              color={colors.primary} 
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.quantityTotal}>
                          Total: ${(service.price * service.quantity).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

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
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addOnsSection: {
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  addOnsSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  addOnItem: {
    marginBottom: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addOnCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  addOnNameActive: {
    color: colors.text,
  },
  addOnPrice: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 28,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  quantityTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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
