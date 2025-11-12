
import React from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { Link } from "expo-router";

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Home Service Technician</Text>
          <Text style={styles.subtitle}>Professional Tools for Field Work</Text>
        </View>

        <View style={styles.cardsContainer}>
          <Link href="/(tabs)/pricingTool" asChild>
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="dollarsign.circle.fill" 
                  android_material_icon_name="attach_money" 
                  size={48} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.cardTitle}>Pricing Tool</Text>
              <Text style={styles.cardDescription}>
                Calculate accurate quotes based on service variables
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(tabs)/jobRequestForm" asChild>
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="doc.text.fill" 
                  android_material_icon_name="description" 
                  size={48} 
                  color={colors.secondary} 
                />
              </View>
              <Text style={styles.cardTitle}>Job Request Form</Text>
              <Text style={styles.cardDescription}>
                Collect customer information and job details
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Streamline your workflow with professional tools designed for home service technicians
          </Text>
        </View>
      </ScrollView>
    </View>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconContainer: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
});
