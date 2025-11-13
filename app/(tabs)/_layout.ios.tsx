
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
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
      <NativeTabs.Trigger key="adminLogin" name="adminLogin">
        <Icon sf="lock.shield.fill" />
        <Label>Admin</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
