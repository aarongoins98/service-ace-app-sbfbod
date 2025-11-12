
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'pricingTool',
      route: '/(tabs)/pricingTool',
      icon: 'attach_money',
      label: 'Pricing',
    },
    {
      name: 'jobRequestForm',
      route: '/(tabs)/jobRequestForm',
      icon: 'description',
      label: 'Job Request',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="pricingTool" name="pricingTool" />
        <Stack.Screen key="jobRequestForm" name="jobRequestForm" />
        <Stack.Screen key="profile" name="profile" />
        <Stack.Screen key="login" name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen key="adminLogin" name="adminLogin" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen key="zipcodeEditor" name="zipcodeEditor" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen key="zipcodeAnalyzer" name="zipcodeAnalyzer" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen key="companyEditor" name="companyEditor" options={{ animation: 'slide_from_right' }} />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
