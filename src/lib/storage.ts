// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "@ankaa_token";

// Store
export const storeToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
};

// Retrieve
export const getStoredToken = async (): Promise<string | null> => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  return token;
};

// Remove
export const removeStoredToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const storeUserData = async (userData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem("cached_user_data", JSON.stringify(userData));
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

export const getUserData = async (): Promise<any> => {
  try {
    const userData = await AsyncStorage.getItem("cached_user_data");
    const parsed = userData ? JSON.parse(userData) : null;
    return parsed;
  } catch (error) {
    console.error("Error retrieving user data:", error);
    return null;
  }
};

export const removeUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("cached_user_data");
  } catch (error) {
    console.error("Error removing user data:", error);
  }
};
