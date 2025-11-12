
import AsyncStorage from '@react-native-async-storage/async-storage';

// This interface is kept for backward compatibility but is no longer actively used
// since the app no longer requires user login
export interface TechnicianInfo {
  companyName: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

const USER_DATA_KEY = '@technician_info';

export const saveUserData = async (userData: TechnicianInfo): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(USER_DATA_KEY, jsonValue);
    console.log('User data saved successfully');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (): Promise<TechnicianInfo | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(USER_DATA_KEY);
    if (jsonValue != null) {
      console.log('User data retrieved successfully');
      return JSON.parse(jsonValue);
    }
    console.log('No user data found');
    return null;
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return null;
  }
};

export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    console.log('User data cleared successfully');
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};

export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const userData = await getUserData();
    return userData !== null;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};
