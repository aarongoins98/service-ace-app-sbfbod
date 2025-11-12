
import React from "react";
import { useTheme } from "@react-navigation/native";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/styles/commonStyles";

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconSymbol 
            ios_icon_name="person.circle.fill" 
            android_material_icon_name="account_circle" 
            size={80} 
            color={colors.primary} 
          />
          <Text style={styles.title}>Technician Profile</Text>
          <Text style={styles.subtitle}>Manage your account settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>John Technician</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="envelope.fill" 
                android_material_icon_name="email" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>john@example.com</Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="phone.fill" 
                android_material_icon_name="phone" 
                size={20} 
                color={colors.textSecondary} 
              />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>(555) 123-4567</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.featureCard}>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={24} 
                color={colors.success} 
              />
              <Text style={styles.featureText}>Pricing Tool for quick quotes</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={24} 
                color={colors.success} 
              />
              <Text style={styles.featureText}>Job request form with CRM integration</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol 
                ios_icon_name="checkmark.circle.fill" 
                android_material_icon_name="check_circle" 
                size={24} 
                color={colors.success} 
              />
              <Text style={styles.featureText}>Optimized for tablets and iPads</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integration Setup</Text>
          <View style={styles.integrationCard}>
            <IconSymbol 
              ios_icon_name="link.circle.fill" 
              android_material_icon_name="link" 
              size={32} 
              color={colors.accent} 
            />
            <Text style={styles.integrationTitle}>Zapier Integration</Text>
            <Text style={styles.integrationText}>
              To connect this app with your CRM:
            </Text>
            <Text style={styles.integrationStep}>
              1. Create a Zapier account at zapier.com
            </Text>
            <Text style={styles.integrationStep}>
              2. Create a new Zap with a Webhook trigger
            </Text>
            <Text style={styles.integrationStep}>
              3. Copy the webhook URL
            </Text>
            <Text style={styles.integrationStep}>
              4. Add the URL to the job request form code
            </Text>
            <Text style={styles.integrationStep}>
              5. Connect your CRM as the action step
            </Text>
          </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    minWidth: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    flex: 1,
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    flex: 1,
  },
  integrationCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  integrationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 16,
  },
  integrationText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  integrationStep: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 8,
    alignSelf: 'flex-start',
    width: '100%',
  },
});
