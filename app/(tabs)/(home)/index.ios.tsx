
import { Link, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { GlassView } from "expo-glass-effect";
import { colors } from "@/styles/commonStyles";
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
});

export default function HomeScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/0632746b-9d1e-4872-9744-4e93c2f862d1.png")}
            style={styles.logo}
          />
          <Text style={[styles.companyName, { color: themeColors.text }]}>
            Refresh
          </Text>
        </View>

        <View style={styles.header}>
          <Text style={[styles.welcomeText, { color: themeColors.text }]}>
            Welcome!
          </Text>
          <Text style={[styles.subtitleText, { color: themeColors.text }]}>
            Choose a tool to get started
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
            onPress={() => {
              console.log("Pricing Tool button pressed");
              router.push("/(tabs)/pricingTool");
            }}
            activeOpacity={0.7}
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
            onPress={() => {
              console.log("Job Request button pressed");
              router.push("/(tabs)/jobRequestForm");
            }}
            activeOpacity={0.7}
          >
            <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Create Job Request</Text>
          </TouchableOpacity>
        </GlassView>
      </ScrollView>
    </View>
  );
}
