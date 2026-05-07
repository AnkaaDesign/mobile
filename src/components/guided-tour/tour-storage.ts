import AsyncStorage from "@react-native-async-storage/async-storage";

const COMPLETED_KEY = "@ankaa:guided-tour:completed";
const VERSION_KEY = "@ankaa:guided-tour:version";

export const TOUR_VERSION = 1;

export const tourStorage = {
  async isCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_KEY);
      const version = await AsyncStorage.getItem(VERSION_KEY);
      if (completed !== "true") return false;
      const storedVersion = version ? parseInt(version, 10) : 0;
      return storedVersion >= TOUR_VERSION;
    } catch {
      return false;
    }
  },
  async markCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(COMPLETED_KEY, "true");
      await AsyncStorage.setItem(VERSION_KEY, String(TOUR_VERSION));
    } catch {}
  },
  async reset(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([COMPLETED_KEY, VERSION_KEY]);
    } catch {}
  },
};
