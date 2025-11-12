
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";
import { Link, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { getUserData, TechnicianInfo } from "@/utils/userStorage";
import { GlassView } from "expo-glass-effect";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [technicianInfo, setTechnicianInfo] = useState<TechnicianInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTechnicianInfo();
  }, []);

  const loadTechnicianInfo = async () => {
    setIsLoading(true);
    try {
      const data = await getUserData();
      setTechnicianInfo(data);
    } catch (error) {
      console.error("Error loading technician info:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconSymbol 
          ios_icon_name="wrench.and.screwdriver.fill" 
          android_material_icon_name="build" 
          size={72} 
          color={colors.primary} 
        />
        <Text style={styles.title}>HVAC Service Tool</Text>
        <Text style={styles.subtitle}>
          Professional pricing and job management for technicians
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : technicianInfo ? (
        <GlassView style={styles.welcomeCard} intensity={80}>
          <IconSymbol 
            ios_icon_name="hand.wave.fill" 
            android_material_icon_name="waving_hand" 
            size={32} 
            color={colors.accent} 
          />
          <Text style={styles.welcomeText}>
            Welcome back, {technicianInfo.firstName}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            {technicianInfo.companyName}
          </Text>
        </GlassView>
      ) : (
        <GlassView style={styles.loginPrompt} intensity={80}>
          <IconSymbol 
            ios_icon_name="person.crop.circle.badge.exclamationmark" 
            android_material_icon_name="person_add" 
            size={48} 
            color={colors.textSecondary} 
          />
          <Text style={styles.loginPromptTitle}>Login Required</Text>
          <Text style={styles.loginPromptText}>
            Please login to save your information and submit job requests
          </Text>
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push("/(tabs)/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </GlassView>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Link href="/(tabs)/pricingTool" asChild>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <GlassView style={styles.actionCardInner} intensity={80}>
              <View style={styles.actionIconContainer}>
                <IconSymbol 
                  ios_icon_name="dollarsign.circle.fill" 
                  android_material_icon_name="attach_money" 
                  size={40} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Pricing Tool</Text>
                <Text style={styles.actionDescription}>
                  Calculate quotes based on square footage, HVAC systems, and location
                </Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron_right" 
                size={24} 
                color={colors.textSecondary} 
              />
            </GlassView>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/jobRequestForm" asChild>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <GlassView style={styles.actionCardInner} intensity={80}>
              <View style={styles.actionIconContainer}>
                <IconSymbol 
                  ios_icon_name="doc.text.fill" 
                  android_material_icon_name="description" 
                  size={40} 
                  color={colors.secondary} 
                />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Job Request Form</Text>
                <Text style={styles.actionDescription}>
                  Collect customer information and submit job requests to your CRM
                </Text>
              </View>
              <IconSymbol 
                ios_icon_name="chevron.right" 
                android_material_icon_name="chevron_right" 
                size={24} 
                color={colors.textSecondary} 
              />
            </GlassView>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          <GlassView style={styles.featureItem} intensity={80}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check_circle" 
              size={28} 
              color={colors.success} 
            />
            <Text style={styles.featureText}>Quick pricing calculations</Text>
          </GlassView>
          <GlassView style={styles.featureItem} intensity={80}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check_circle" 
              size={28} 
              color={colors.success} 
            />
            <Text style={styles.featureText}>Zipcode-based surcharges</Text>
          </GlassView>
          <GlassView style={styles.featureItem} intensity={80}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check_circle" 
              size={28} 
              color={colors.success} 
            />
            <Text style={styles.featureText}>CRM integration ready</Text>
          </GlassView>
          <GlassView style={styles.featureItem} intensity={80}>
            <IconSymbol 
              ios_icon_name="checkmark.circle.fill" 
              android_material_icon_name="check_circle" 
              size={28} 
              color={colors.success} 
            />
            <Text style={styles.featureText}>Optimized for tablets</Text>
          </GlassView>
        </View>
      </View>

      <GlassView style={styles.infoCard} intensity={80}>
        <IconSymbol 
          ios_icon_name="info.circle.fill" 
          android_material_icon_name="info" 
          size={24} 
          color={colors.accent} 
        />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Integration Ready</Text>
          <Text style={styles.infoText}>
            This app is designed to work with Zapier for seamless CRM integration. 
            Configure your webhook in the job request form to start sending data automatically.
          </Text>
        </View>
      </GlassView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  welcomeSubtext: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  loginPrompt: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loginPromptText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    paddingHorizontal: 32,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  actionCard: {
    marginBottom: 12,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
