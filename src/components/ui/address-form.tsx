import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, spacing } from "@/constants/design-system";
import { ZipCodeInput } from "./zipcode-input";
import { TextInput } from "./text-input";

export interface AddressFormData {
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface AddressFormProps {
  value?: AddressFormData;
  onChange?: (address: AddressFormData) => void;
  errors?: Partial<Record<keyof AddressFormData, string>>;
  disabled?: boolean;
  showCountry?: boolean;
  containerStyle?: any;
}

export function AddressForm({
  value = {},
  onChange,
  errors = {},
  disabled = false,
  showCountry = false,
  containerStyle,
}: AddressFormProps) {
  const { colors } = useTheme();
  const [addressData, setAddressData] = useState<AddressFormData>(value);

  const handleFieldChange = (field: keyof AddressFormData, fieldValue: string | undefined) => {
    const newAddress = {
      ...addressData,
      [field]: fieldValue,
    };
    setAddressData(newAddress);
    onChange?.(newAddress);
  };

  const handleCepChange = (cepData: {
    cep: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  }) => {
    const newAddress = {
      ...addressData,
      zipCode: cepData.cep,
      street: cepData.address || addressData.street,
      neighborhood: cepData.neighborhood || addressData.neighborhood,
      city: cepData.city || addressData.city,
      state: cepData.state || addressData.state,
    };
    setAddressData(newAddress);
    onChange?.(newAddress);
  };

  React.useEffect(() => {
    setAddressData(value);
  }, [value]);

  return (
    <View style={StyleSheet.flatten([styles.container, containerStyle])}>
      <Text style={StyleSheet.flatten([styles.sectionTitle, { color: colors.foreground }])}>
        Endereço
      </Text>

      {/* CEP - ZIP Code */}
      <ZipCodeInput
        label="CEP"
        value={addressData.zipCode}
        onChange={(val) => handleFieldChange("zipCode", val)}
        onCepChange={handleCepChange}
        error={!!errors.zipCode}
        helperText={errors.zipCode}
        editable={!disabled}
      />

      {/* Street - Logradouro */}
      <TextInput
        label="Rua/Logradouro"
        value={addressData.street || ""}
        onChangeText={(val) => handleFieldChange("street", val)}
        error={!!errors.street}
        helperText={errors.street}
        placeholder="Rua das Flores"
        editable={!disabled}
      />

      {/* Number and Complement Row */}
      <View style={styles.row}>
        <View style={styles.numberField}>
          <TextInput
            label="Número"
            value={addressData.number || ""}
            onChangeText={(val) => handleFieldChange("number", val)}
            error={!!errors.number}
            helperText={errors.number}
            placeholder="123"
            keyboardType="numeric"
            editable={!disabled}
          />
        </View>
        <View style={styles.complementField}>
          <TextInput
            label="Complemento"
            value={addressData.complement || ""}
            onChangeText={(val) => handleFieldChange("complement", val)}
            error={!!errors.complement}
            helperText={errors.complement}
            placeholder="Apto 45"
            editable={!disabled}
          />
        </View>
      </View>

      {/* Neighborhood */}
      <TextInput
        label="Bairro"
        value={addressData.neighborhood || ""}
        onChangeText={(val) => handleFieldChange("neighborhood", val)}
        error={!!errors.neighborhood}
        helperText={errors.neighborhood}
        placeholder="Centro"
        editable={!disabled}
      />

      {/* City and State Row */}
      <View style={styles.row}>
        <View style={styles.cityField}>
          <TextInput
            label="Cidade"
            value={addressData.city || ""}
            onChangeText={(val) => handleFieldChange("city", val)}
            error={!!errors.city}
            helperText={errors.city}
            placeholder="São Paulo"
            editable={!disabled}
          />
        </View>
        <View style={styles.stateField}>
          <TextInput
            label="Estado"
            value={addressData.state || ""}
            onChangeText={(val) => handleFieldChange("state", val)}
            error={!!errors.state}
            helperText={errors.state}
            placeholder="SP"
            maxLength={2}
            autoCapitalize="characters"
            editable={!disabled}
          />
        </View>
      </View>

      {/* Country (optional) */}
      {showCountry && (
        <TextInput
          label="País"
          value={addressData.country || "Brasil"}
          onChangeText={(val) => handleFieldChange("country", val)}
          error={!!errors.country}
          helperText={errors.country}
          placeholder="Brasil"
          editable={!disabled}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  numberField: {
    flex: 1,
  },
  complementField: {
    flex: 2,
  },
  cityField: {
    flex: 2,
  },
  stateField: {
    flex: 1,
  },
});
