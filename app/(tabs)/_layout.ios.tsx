
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger key="home" name="(home)">
          <Icon sf="house.fill" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger key="pricingTool" name="pricingTool">
          <Icon sf="dollarsign.circle.fill" />
          <Label>Pricing</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger key="jobRequestForm" name="jobRequestForm">
          <Icon sf="doc.text.fill" />
          <Label>Job Request</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger key="profile" name="profile">
          <Icon sf="person.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <Stack screenOptions={{ headerShown: false, presentation: 'modal' }}>
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}
