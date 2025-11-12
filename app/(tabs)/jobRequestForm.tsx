
import React, { useState } from "react";
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JobRequestFormScreen() {
  const theme = useTheme();
  
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\d{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!customerName || !phone || !email || !address || !jobDescription) {
      Alert.alert("Missing Information", "Please fill in all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number (at least 10 digits).");
      return;
    }

    // Prepare data for submission
    const jobData = {
      customerName,
      phone,
      email,
      address,
      jobDescription,
      preferredDate: preferredDate || "Not specified",
      submittedAt: new Date().toISOString(),
    };

    console.log("Job Request Data:", jobData);

    // Here you would integrate with Zapier webhook
    // Example: await fetch('YOUR_ZAPIER_WEBHOOK_URL', { method: 'POST', body: JSON.stringify(jobData) });
    
    // For now, show success message
    setIsSubmitted(true);
    Alert.alert(
      "Success!", 
      "Job request submitted successfully. You can integrate this with Zapier to send data to your CRM.",
      [
        {
          text: "OK",
          onPress: () => {
            console.log("Job request submitted");
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setCustomerName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setJobDescription("");
    setPreferredDate("");
    setIsSubmitted(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="doc.text.fill" 
            android_material_icon_name="description" 
            size={56} 
            color={colors.secondary} 
          />
          <Text style={styles.title}>Job Request Form</Text>
          <Text style={styles.subtitle}>Collect customer and job information</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter customer name"
              placeholderTextColor={colors.textSecondary}
              value={customerName}
              onChangeText={setCustomerName}
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
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Job Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main St, City, State, ZIP"
              placeholderTextColor={colors.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Job Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the service needed..."
              placeholderTextColor={colors.textSecondary}
              value={jobDescription}
              onChangeText={setJobDescription}
              multiline
              numberOfLines={4}
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
            />
          </View>

          {!isSubmitted ? (
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Submit Job Request</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.successContainer}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={48} 
                color={colors.success} 
              />
              <Text style={styles.successText}>Job Request Submitted!</Text>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>Submit Another Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.secondary} 
          />
          <Text style={styles.infoText}>
            To integrate with your CRM via Zapier, you&apos;ll need to set up a webhook URL in the code and create a Zap that receives this data.
          </Text>
        </View>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
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
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.success,
    marginTop: 12,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 24,
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 14,
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
});
