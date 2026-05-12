import AsyncStorage from "@react-native-async-storage/async-storage";

const COMPLETED_KEY = (userId: string) => `@ankaa:tutorial:completed:${userId}`;
const VERSION_KEY = (userId: string) => `@ankaa:tutorial:version:${userId}`;

/**
 * Bump this whenever the step library changes meaningfully — older completed
 * users get re-invited through the new walkthrough.
 */
export const TUTORIAL_VERSION = 3;

export const tutorialStorage = {
  async isCompleted(userId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const completed = await AsyncStorage.getItem(COMPLETED_KEY(userId));
      const version = await AsyncStorage.getItem(VERSION_KEY(userId));
      if (completed !== "true") return false;
      const storedVersion = version ? parseInt(version, 10) : 0;
      return storedVersion >= TUTORIAL_VERSION;
    } catch {
      return false;
    }
  },
  async markCompleted(userId: string): Promise<void> {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(COMPLETED_KEY(userId), "true");
      await AsyncStorage.setItem(VERSION_KEY(userId), String(TUTORIAL_VERSION));
    } catch {}
  },
  async reset(userId: string): Promise<void> {
    if (!userId) return;
    try {
      await AsyncStorage.multiRemove([COMPLETED_KEY(userId), VERSION_KEY(userId)]);
    } catch {}
  },
};
