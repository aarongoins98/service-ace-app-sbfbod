
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

export default function PricingToolScreen() {
  const theme = useTheme();
  
  const [serviceType, setServiceType] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [complexity, setComplexity] = useState("");
  const [urgency, setUrgency] = useState("");
  const [quote, setQuote] = useState<number | null>(null);

  const calculateQuote = () => {
    // Validate inputs
    if (!serviceType || !squareFootage || !complexity || !urgency) {
      Alert.alert("Missing Information", "Please fill in all fields to generate a quote.");
      return;
    }

    const sqFt = parseFloat(squareFootage);
    if (isNaN(sqFt) || sqFt <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid square footage.");
      return;
    }

    // Base rate per square foot
    let baseRate = 2.5;

    // Service type multiplier
    const serviceMultipliers: { [key: string]: number } = {
      'plumbing': 1.2,
      'electrical': 1.3,
      'hvac': 1.4,
      'general': 1.0,
    };
    const serviceKey = serviceType.toLowerCase();
    const serviceMultiplier = serviceMultipliers[serviceKey] || 1.0;

    // Complexity multiplier
    const complexityMultipliers: { [key: string]: number } = {
      'simple': 1.0,
      'moderate': 1.3,
      'complex': 1.6,
    };
    const complexityKey = complexity.toLowerCase();
    const complexityMultiplier = complexityMultipliers[complexityKey] || 1.0;

    // Urgency multiplier
    const urgencyMultipliers: { [key: string]: number } = {
      'standard': 1.0,
      'priority': 1.25,
      'emergency': 1.5,
    };
    const urgencyKey = urgency.toLowerCase();
    const urgencyMultiplier = urgencyMultipliers[urgencyKey] || 1.0;

    // Calculate final quote
    const calculatedQuote = sqFt * baseRate * serviceMultiplier * complexityMultiplier * urgencyMultiplier;
    setQuote(Math.round(calculatedQuote * 100) / 100);
  };

  const resetForm = () => {
    setServiceType("");
    setSquareFootage("");
    setComplexity("");
    setUrgency("");
    setQuote(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="dollarsign.circle.fill" 
            android_material_icon_name="attach_money" 
            size={56} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Pricing Tool</Text>
          <Text style={styles.subtitle}>Generate accurate service quotes</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Plumbing, Electrical, HVAC, General"
              placeholderTextColor={colors.textSecondary}
              value={serviceType}
              onChangeText={setServiceType}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Square Footage</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter area in square feet"
              placeholderTextColor={colors.textSecondary}
              value={squareFootage}
              onChangeText={setSquareFootage}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Complexity Level</Text>
            <TextInput
              style={styles.input}
              placeholder="Simple, Moderate, or Complex"
              placeholderTextColor={colors.textSecondary}
              value={complexity}
              onChangeText={setComplexity}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Urgency</Text>
            <TextInput
              style={styles.input}
              placeholder="Standard, Priority, or Emergency"
              placeholderTextColor={colors.textSecondary}
              value={urgency}
              onChangeText={setUrgency}
            />
          </View>

          <TouchableOpacity 
            style={styles.calculateButton} 
            onPress={calculateQuote}
            activeOpacity={0.8}
          >
            <Text style={styles.calculateButtonText}>Calculate Quote</Text>
          </TouchableOpacity>

          {quote !== null && (
            <View style={styles.quoteContainer}>
              <Text style={styles.quoteLabel}>Estimated Quote</Text>
              <Text style={styles.quoteAmount}>${quote.toFixed(2)}</Text>
              <Text style={styles.quoteNote}>
                This is an estimated quote based on the provided information
              </Text>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <Text style={styles.resetButtonText}>Reset Form</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoBox}>
          <IconSymbol 
            ios_icon_name="info.circle.fill" 
            android_material_icon_name="info" 
            size={20} 
            color={colors.primary} 
          />
          <Text style={styles.infoText}>
            Quotes are calculated based on service type, area, complexity, and urgency
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
  calculateButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  quoteContainer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: colors.highlight,
    borderRadius: 12,
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quoteAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  quoteNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
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
    alignItems: 'center',
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
