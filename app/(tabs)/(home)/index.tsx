
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useTheme } from "@react-navigation/native";
import { IconSymbol } from "@/components/IconSymbol";
import { Link, useRouter } from "expo-router";
import { colors } from "@/styles/commonStyles";
import { getUserData, TechnicianInfo } from "@/utils/userStorage";

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
        <Image 
          source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Refresh Pricing/Booking Tool</Text>
        <Text style={styles.subtitle}>
          The most Refreshing way to order cleaner, healthy ducts.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : technicianInfo ? (
        <View style={styles.welcomeCard}>
          <Image 
            source={require('@/assets/images/a078dd88-e996-4ae7-a894-90dfc7c624dc.png')}
            style={styles.welcomeLogo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>
            Welcome back, {technicianInfo.firstName}!
          </Text>
          <Text style={styles.welcomeSubtext}>
            {technicianInfo.companyName}
          </Text>
        </View>
      ) : (
        <View style={styles.loginPrompt}>
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
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Refresh?</Text>
        
        <View style={styles.whyRefreshCard}>
          <View style={styles.categoryHeader}>
            <IconSymbol 
              ios_icon_name="wrench.and.screwdriver.fill" 
              android_material_icon_name="build" 
              size={28} 
              color={colors.primary} 
            />
            <Text style={styles.categoryTitle}>Our Technology</Text>
          </View>

          <View style={styles.technologySection}>
            <Text style={styles.technologyTitle}>Hypervac™ Truck-Mounted Duct Cleaning System</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Gasoline-powered 35 HP engine generating up to 15,000 CFM of suction.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Safe for all duct types – metal, flex, or lined.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Removes fine dust, debris, and construction residue that portable units miss.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Provides deep, source-removal cleaning through true negative air pressure.</Text>
              </View>
            </View>
          </View>

          <View style={styles.technologySection}>
            <Text style={styles.technologyTitle}>Aeroseal® Duct Sealing Technology:</Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Patented internal sealing process developed at Lawrence Berkeley National Laboratory.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Atomized polymer seals leaks up to ⅝ inch.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Achieves up to 90% reduction in leakage and 20–30% efficiency gains.</Text>
              </View>
              <View style={styles.bulletItem}>
                <View style={styles.bullet} />
                <Text style={styles.bulletText}>Includes printed before-and-after verification reports.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.whyRefreshCard}>
          <View style={styles.categoryHeader}>
            <IconSymbol 
              ios_icon_name="star.fill" 
              android_material_icon_name="star" 
              size={28} 
              color={colors.secondary} 
            />
            <Text style={styles.categoryTitle}>Professional Standards</Text>
          </View>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Technicians wear shoe covers, use floor coverings and corner guards.</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>HVAC systems are fully isolated before cleaning/sealing.</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Every job includes photo documentation and measurable results.</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Crews leave each home cleaner than they found it.</Text>
            </View>
          </View>
        </View>
      </View>
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
  logo: {
    width: 200,
    height: 100,
    marginBottom: 16,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  welcomeLogo: {
    width: 80,
    height: 40,
    marginBottom: 12,
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
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },
  whyRefreshCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  technologySection: {
    marginBottom: 20,
  },
  technologyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
