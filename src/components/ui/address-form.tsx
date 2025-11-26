import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/lib/theme";
import { fontSize, spacing } from "@/constants/design-system";
import { useKeyboardAwareForm } from "@/contexts/KeyboardAwareFormContext";
import { ZipCodeInput } from "./zipcode-input";
import { Input } from "./input";
import { Label } from "./label";

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
  const keyboardContext = useKeyboardAwareForm();
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
        fieldKey="address-zipcode"
        value={addressData.zipCode}
        onChange={(val) => handleFieldChange("zipCode", val)}
        onCepChange={handleCepChange}
        error={!!errors.zipCode}
        helperText={errors.zipCode}
        editable={!disabled}
      />

      {/* Street - Logradouro */}
      <View style={styles.fieldContainer}>
        <Label style={styles.label}>Rua/Logradouro</Label>
        <Input
          type="text"
          fieldKey="address-street"
          value={addressData.street || ""}
          onChangeText={(val) => handleFieldChange("street", String(val ?? ""))}
          error={!!errors.street}
          errorMessage={errors.street}
          placeholder="Rua das Flores"
          disabled={disabled}
        />
      </View>

      {/* Number and Complement Row */}
      <View style={styles.row}>
        <View style={styles.numberField}>
          <View style={styles.fieldContainer}>
            <Label style={styles.label}>Número</Label>
            <Input
              type="natural"
              fieldKey="address-number"
              value={addressData.number || ""}
              onChangeText={(val) => handleFieldChange("number", String(val ?? ""))}
              error={!!errors.number}
              errorMessage={errors.number}
              placeholder="123"
              disabled={disabled}
            />
          </View>
        </View>
        <View style={styles.complementField}>
          <View style={styles.fieldContainer}>
            <Label style={styles.label}>Complemento</Label>
            <Input
              type="text"
              fieldKey="address-complement"
              value={addressData.complement || ""}
              onChangeText={(val) => handleFieldChange("complement", String(val ?? ""))}
              error={!!errors.complement}
              errorMessage={errors.complement}
              placeholder="Apto 45"
              disabled={disabled}
            />
          </View>
        </View>
      </View>

      {/* Neighborhood */}
      <View style={styles.fieldContainer}>
        <Label style={styles.label}>Bairro</Label>
        <Input
          type="text"
          fieldKey="address-neighborhood"
          value={addressData.neighborhood || ""}
          onChangeText={(val) => handleFieldChange("neighborhood", String(val ?? ""))}
          error={!!errors.neighborhood}
          errorMessage={errors.neighborhood}
          placeholder="Centro"
          disabled={disabled}
        />
      </View>

      {/* City and State Row */}
      <View style={styles.row}>
        <View style={styles.cityField}>
          <View style={styles.fieldContainer}>
            <Label style={styles.label}>Cidade</Label>
            <Input
              type="text"
              fieldKey="address-city"
              value={addressData.city || ""}
              onChangeText={(val) => handleFieldChange("city", String(val ?? ""))}
              error={!!errors.city}
              errorMessage={errors.city}
              placeholder="São Paulo"
              disabled={disabled}
            />
          </View>
        </View>
        <View style={styles.stateField}>
          <View style={styles.fieldContainer}>
            <Label style={styles.label}>Estado</Label>
            <Input
              type="text"
              fieldKey="address-state"
              value={addressData.state || ""}
              onChangeText={(val) => handleFieldChange("state", String(val ?? ""))}
              error={!!errors.state}
              errorMessage={errors.state}
              placeholder="SP"
              maxLength={2}
              autoCapitalize="characters"
              disabled={disabled}
            />
          </View>
        </View>
      </View>

      {/* Country (optional) */}
      {showCountry && (
        <View style={styles.fieldContainer}>
          <Label style={styles.label}>País</Label>
          <Input
            type="text"
            fieldKey="address-country"
            value={addressData.country || "Brasil"}
            onChangeText={(val) => handleFieldChange("country", String(val ?? ""))}
            error={!!errors.country}
            errorMessage={errors.country}
            placeholder="Brasil"
            disabled={disabled}
          />
        </View>
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
  fieldContainer: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
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
