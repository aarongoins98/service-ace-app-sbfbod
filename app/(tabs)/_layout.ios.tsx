
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
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="login" name="login">
        <Icon sf="person.badge.key.fill" />
        <Label>Login</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="adminLogin" name="adminLogin">
        <Icon sf="lock.shield.fill" />
        <Label>Admin</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="zipcodeEditor" name="zipcodeEditor">
        <Icon sf="map.fill" />
        <Label>Zipcodes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="zipcodeAnalyzer" name="zipcodeAnalyzer">
        <Icon sf="chart.bar.fill" />
        <Label>Analyzer</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="companyEditor" name="companyEditor">
        <Icon sf="building.2.fill" />
        <Label>Companies</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
