// AddressSearchInput.jsx - Fixed component with proper dropdown positioning
import { useState, useRef, useCallback, useEffect } from "react";
import { ActivityIndicator, FlatList, Keyboard, TextInput, TouchableOpacity, View , StyleSheet} from "react-native";
import { Text } from "./text";
// Remove lodash dependency - use native implementation
import { IconSearch, IconX } from "@tabler/icons-react-native";

interface AddressSearchInputProps {
  placeholder?: string;
  onPlaceSelect: (place: any) => void;
  apiKey: string;
  searchDelay?: number;
  country?: string;
  language?: string;
}

export function AddressSearchInput({
  placeholder = "Buscar endereço ou empresa...",
  onPlaceSelect,
  apiKey, // API key required
  searchDelay = 300,
  country = "br",
  language = "pt-BR",
}: AddressSearchInputProps) {
  // All hooks must be called before any conditional returns
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [_searchAttempts, _setSearchAttempts] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Native debounce implementation to prevent too many API calls
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for API key after all hooks are called
  if (!apiKey) {
    console.error("AddressSearchInput: apiKey is required");
    return null;
  }

  const debouncedSearch = useCallback(
    (text: string, attempt = 0) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        if (text.length < 2) {
          setSearchResults([]);
          return;
        }
        setIsLoading(true);
        setErrorMessage("");
        try {
          // Modify search based on attempt number to improve results
          let searchText = text;
          let searchTypes = "establishment|address";
          if (attempt === 1) {
            searchText = `empresa ${text}`;
          } else if (attempt === 2) {
            searchTypes = "establishment";
          } else if (attempt === 3) {
            searchText = `companhia ${text}`;
            searchTypes = "establishment";
          }
          // Call Google Places API
          const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(searchText)}&types=${searchTypes}&language=${language}&components=country:${country}&key=${apiKey}`;
          const response = await fetch(url);
          const data = await response.json();
          if (data.status === "OK" && data.predictions) {
            const options = data.predictions.map((prediction: any /* TODO: Add proper type */) => {
              const mainText = prediction.structured_formatting?.main_text || "";
              const secondaryText = prediction.structured_formatting?.secondary_text || "";
              let label = prediction.description;
              if (mainText && secondaryText) {
                label = `${mainText} - ${secondaryText}`;
              }
              return {
                label: label,
                value: prediction.place_id,
                placeId: prediction.place_id,
                mainText,
                secondaryText,
              };
            });
            setSearchResults(options);
            // Only show dropdown if not in editing mode
            if (!isEditing) {
              setDropdownVisible(true);
            }
            if (options.length === 0 && attempt < 3) {
              _setSearchAttempts(attempt + 1);
              debouncedSearch(text, attempt + 1);
            } else if (options.length === 0) {
              setErrorMessage("Nenhum resultado encontrado. Tente modificar sua busca.");
            }
          } else {
            if (attempt < 3) {
              _setSearchAttempts(attempt + 1);
              debouncedSearch(text, attempt + 1);
            } else {
              setErrorMessage(`Erro na busca: ${data.status || "Falha na API"}`);
              setSearchResults([]);
            }
          }
        } catch (error) {
          console.error("Error searching for addresses:", error);
          setErrorMessage("Erro ao buscar endereços. Tente novamente.");
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, searchDelay);
    },
    [apiKey, country, language, isEditing, searchDelay],
  );
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  // Handle text input changes
  const handleTextChange = (text: any /* TODO: Add proper type */) => {
    setSearchText(text);
    _setSearchAttempts(0);
    setIsEditing(false); // Reset editing mode when text changes
    if (text.length > 0) {
      debouncedSearch(text);
    } else {
      setSearchResults([]);
      setDropdownVisible(false);
    }
  };
  // Focus handler - DON'T show dropdown when focused if in editing mode
  const handleFocus = () => {
    setIsEditing(true); // Enter editing mode when focusing
    setDropdownVisible(false); // Keep dropdown hidden when first focusing
  };
  // Fetch place details when a place is selected
  const fetchPlaceDetails = async (placeId: any /* TODO: Add proper type */) => {
    if (!placeId) return null;
    setIsLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,address_component,geometry,international_phone_number,website&language=${language}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.result) {
        const details = data.result;
        let streetNumber = "";
        let street = "";
        let neighborhood = "";
        let city = "";
        let state = "";
        let postalCode = "";
        let formattedAddress = details.formatted_address || "";
        let businessName = details.name || "";
        let phoneNumber = details.international_phone_number || "";
        let website = details.website || "";
        let latitude = "";
        let longitude = "";
        if (details.geometry?.location) {
          latitude = details.geometry.location.lat.toString();
          longitude = details.geometry.location.lng.toString();
        }
        if (details.address_components) {
          details.address_components.forEach((component: any /* TODO: Add proper type */) => {
            const types = component.types;
            if (types.includes("street_number")) {
              streetNumber = component.long_name;
            }
            if (types.includes("route")) {
              street = component.long_name;
            }
            if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
              neighborhood = component.long_name;
            }
            if (types.includes("administrative_area_level_2")) {
              city = component.long_name;
            } else if (types.includes("locality")) {
              if (!city) city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            }
            if (types.includes("postal_code")) {
              postalCode = component.long_name;
            }
          });
        }
        let address = formattedAddress;
        if (street) {
          address = `${street}${streetNumber ? `, ${streetNumber}` : ""}`;
          if (neighborhood) {
            address += `, ${neighborhood}`;
          }
        }
        return {
          address,
          city,
          state,
          postalCode,
          businessName,
          phoneNumber,
          website,
          latitude,
          longitude,
          neighborhood,
          formattedAddress,
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting place details:", error);
      setErrorMessage("Erro ao obter detalhes do local. Tente novamente.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  // Handle option selection
  const handleSelectOption = async (option: any /* TODO: Add proper type */) => {
    setDropdownVisible(false);
    setSearchText(option.label);
    setIsEditing(true); // Set editing mode to true when an option is selected
    Keyboard.dismiss();
    const placeDetails = await fetchPlaceDetails(option.placeId);
    if (placeDetails && onPlaceSelect) {
      onPlaceSelect(placeDetails);
    }
  };
  // Handle clicking on the search icon to start a new search
  const handleSearchClick = () => {
    setIsEditing(false);
    if (searchText.length > 1) {
      setDropdownVisible(true);
      if (searchResults.length === 0) {
        debouncedSearch(searchText);
      }
    }
  };
  // Handle dropdown close without clearing input
  const handleCloseDropdown = () => {
    setDropdownVisible(false);
    setIsEditing(true); // Set to editing mode when closing the dropdown
    Keyboard.dismiss();
  };
  // Try a different search approach
  const handleRetry = () => {
    if (searchText) {
      _setSearchAttempts(0);
      setIsEditing(false);
      debouncedSearch(`empresa ${searchText}`);
    }
  };
  // Render each item in the results list
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleSelectOption(item)} activeOpacity={0.7}>
      <Text style={styles.resultLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.container}>
      {/* Input field with loading indicator and search icon */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={searchText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          style={styles.input}
          onFocus={handleFocus}
          autoCapitalize="none"
          className="bg-transparent"
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#3b82f6" style={styles.inputIcon} />
        ) : (
          <TouchableOpacity onPress={searchText.length > 0 ? (isEditing ? handleSearchClick : () => setSearchText("")) : undefined} style={styles.iconButton}>
            {searchText.length > 0 ? isEditing ? <IconSearch size={18} /> : <IconX size={18} /> : <IconSearch size={18} />}
          </TouchableOpacity>
        )}
      </View>

      {/* Results dropdown - positioned below the input field */}
      {dropdownVisible && (
        <View style={StyleSheet.flatten([styles.dropdown, { width: "100%" }])}>
          {/* Error message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Tentar outro formato de busca</Text>
              </TouchableOpacity>
            </View>
          ) : searchResults.length === 0 && !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchText.length > 1 ? `Nenhum resultado encontrado para "${searchText}"` : "Digite mais caracteres para iniciar a busca"}
              </Text>
            </View>
          ) : null}

          {/* Results list */}
          <FlatList
            data={searchResults}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled={true}
          />

          {/* Close button at the bottom */}
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseDropdown}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
// Refined styles
const styles = StyleSheet.create({
  container: {
    width: "100%",
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    backgroundColor: "transparent",
    height: 40,
    overflow: "hidden",
    zIndex: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#374151",
    height: "100%",
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  iconButton: {
    padding: 10,
    marginRight: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  searchIcon: {
    fontSize: 16,
    color: "#6b7280",
  },
  dropdown: {
    position: "absolute",
    top: 48, // Positioned below the input height
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  emptyState: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  errorContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 8,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#dbeafe",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  resultsList: {
    maxHeight: 200,
  },
  resultsContent: {
    flexGrow: 1,
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  resultLabel: {
    fontSize: 15,
    color: "#374151",
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  closeButtonText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
});
