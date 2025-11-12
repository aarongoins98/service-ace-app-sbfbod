
import { Link, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { GlassView } from "expo-glass-effect";
import { colors } from "@/styles/commonStyles";
import { getUserData, TechnicianInfo } from "@/utils/userStorage";
import { IconSymbol } from "@/components/IconSymbol";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 18,
    opacity: 0.7,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 30,
    marginBottom: 16,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTechnicianInfo();
  }, []);

  const loadTechnicianInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserData();
      setTechnicianInfo(data);
    } catch (err) {
      console.error("Error loading technician info:", err);
      setError("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadTechnicianInfo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!technicianInfo) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={[styles.welcomeText, { color: themeColors.text }]}>
              Welcome!
            </Text>
            <Text style={[styles.subtitleText, { color: themeColors.text }]}>
              Please log in to continue
            </Text>
          </View>

          <GlassView style={styles.card} tint="light">
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              Get Started
            </Text>
            <Text style={[styles.cardDescription, { color: themeColors.text }]}>
              Log in to access pricing tools and job request forms
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/(tabs)/login")}
            >
              <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
          </GlassView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/0632746b-9d1e-4872-9744-4e93c2f862d1.png")}
            style={styles.logo}
          />
          <Text style={[styles.companyName, { color: themeColors.text }]}>
            {technicianInfo.companyName || "Refresh"}
          </Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: themeColors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.subtitleText, { color: themeColors.text }]}>
            {technicianInfo.firstName} {technicianInfo.lastName}
          </Text>
        </View>

        <GlassView style={styles.card} tint="light">
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>
            Pricing Tool
          </Text>
          <Text style={[styles.cardDescription, { color: themeColors.text }]}>
            Calculate quotes for HVAC services based on square footage and location
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(tabs)/pricingTool")}
          >
            <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Open Pricing Tool</Text>
          </TouchableOpacity>
        </GlassView>

        <GlassView style={styles.card} tint="light">
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>
            Job Request Form
          </Text>
          <Text style={[styles.cardDescription, { color: themeColors.text }]}>
            Submit customer information and job details
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(tabs)/jobRequestForm")}
          >
            <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Create Job Request</Text>
          </TouchableOpacity>
        </GlassView>
      </ScrollView>
    </View>
  );
}
