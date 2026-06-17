import { useEffect, useRef } from "react";
import { Alert, AppState, AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

/**
 * Over-the-air (OTA) update checker for the self-hosted Expo Updates server.
 *
 * On launch (and when the app returns to the foreground) it:
 *   1. Asks the server whether a newer JS bundle exists for this runtimeVersion.
 *   2. Downloads it in the background if available.
 *   3. Prompts the user to restart to apply it.
 *
 * It is a no-op in development, in Expo Go, and whenever expo-updates is
 * disabled, and it swallows network errors so a missing/unreachable update
 * server never affects normal app usage.
 */
export function useOtaUpdates(): void {
  const isChecking = useRef(false);
  // Update id the user already declined ("Mais tarde") — don't re-prompt for
  // the same update on every foreground. Cleared on cold start (new hook
  // instance), so the downloaded update still applies / re-prompts then.
  const declinedUpdateId = useRef<string | null>(null);

  useEffect(() => {
    // Updates only run in built apps with expo-updates enabled.
    if (__DEV__ || !Updates.isEnabled) {
      return;
    }

    let isMounted = true;

    const checkForUpdate = async () => {
      if (isChecking.current) {
        return;
      }
      isChecking.current = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!isMounted || !result.isAvailable) {
          return;
        }

        const updateId = result.manifest?.id ?? null;
        if (updateId && updateId === declinedUpdateId.current) {
          // User already said "Mais tarde" for this update in this session.
          return;
        }

        await Updates.fetchUpdateAsync();
        if (!isMounted) {
          return;
        }

        Alert.alert(
          "Atualização disponível",
          "Uma nova versão do aplicativo foi baixada. Deseja reiniciar agora para aplicá-la?",
          [
            {
              text: "Mais tarde",
              style: "cancel",
              onPress: () => {
                declinedUpdateId.current = updateId;
              },
            },
            {
              text: "Reiniciar",
              onPress: () => {
                Updates.reloadAsync().catch(() => {
                  // If reload fails, the update applies on the next cold start.
                });
              },
            },
          ],
        );
      } catch {
        // Best-effort: offline, LAN-only, or no server — ignore silently.
      } finally {
        isChecking.current = false;
      }
    };

    // Check on mount...
    checkForUpdate();

    // ...and whenever the app comes back to the foreground.
    const subscription = AppState.addEventListener(
      "change",
      (state: AppStateStatus) => {
        if (state === "active") {
          checkForUpdate();
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}
