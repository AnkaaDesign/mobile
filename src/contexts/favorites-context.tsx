import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@ankaa_favorites";
const SHOW_FAVORITES_KEY = "@ankaa_sidebar_show_favorites";

export interface FavoriteItem {
  id: string;
  path: string;
  title: string;
  icon?: string;
  addedAt: Date;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  showFavorites: boolean;
  addFavorite: (item: Omit<FavoriteItem, "id" | "addedAt">) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (path: string) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, "id" | "addedAt">) => Promise<void>;
  toggleShowFavorites: () => Promise<void>;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setFavorites(
            parsed.map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }))
          );
        }

        const showFavoritesStored = await AsyncStorage.getItem(SHOW_FAVORITES_KEY);
        if (showFavoritesStored !== null) {
          setShowFavorites(showFavoritesStored === "true");
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to AsyncStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      const saveFavorites = async () => {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
          console.error("Error saving favorites:", error);
        }
      };

      saveFavorites();
    }
  }, [favorites, isLoading]);

  // Save showFavorites to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      const saveShowFavorites = async () => {
        try {
          await AsyncStorage.setItem(SHOW_FAVORITES_KEY, showFavorites.toString());
        } catch (error) {
          console.error("Error saving show favorites preference:", error);
        }
      };

      saveShowFavorites();
    }
  }, [showFavorites, isLoading]);

  const addFavorite = useCallback(async (item: Omit<FavoriteItem, "id" | "addedAt">) => {
    const newFavorite: FavoriteItem = {
      ...item,
      id: `${item.path}-${Date.now()}`,
      addedAt: new Date(),
    };

    setFavorites((prev) => [...prev, newFavorite]);
  }, []);

  const removeFavorite = useCallback(async (id: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== id));
  }, []);

  const isFavorite = useCallback(
    (path: string): boolean => {
      return favorites.some((fav) => fav.path === path);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (item: Omit<FavoriteItem, "id" | "addedAt">) => {
      const existing = favorites.find((fav) => fav.path === item.path);
      if (existing) {
        await removeFavorite(existing.id);
      } else {
        await addFavorite(item);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  const toggleShowFavorites = useCallback(async () => {
    setShowFavorites((prev) => !prev);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const value = useMemo(
    () => ({
      favorites,
      showFavorites,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      toggleShowFavorites,
      isLoading,
    }),
    [favorites, showFavorites, addFavorite, removeFavorite, isFavorite, toggleFavorite, toggleShowFavorites, isLoading]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
