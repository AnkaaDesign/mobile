import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { representativeService } from '@/services/representativeService';
import {
  Representative,
  RepresentativeRole,
  REPRESENTATIVE_ROLE_LABELS,
  REPRESENTATIVE_ROLE_COLORS,
} from '@/types/representative';
import { useTheme } from '@/lib/theme';

interface RepresentativeSelectorProps {
  customerId: string;
  value: string[]; // Array of representative IDs
  onChange: (representativeIds: string[]) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  allowedRoles?: RepresentativeRole[];
}

export const RepresentativeSelector: React.FC<RepresentativeSelectorProps> = ({
  customerId,
  value = [],
  onChange,
  error,
  disabled,
  label = 'Representantes',
  required = false,
  multiple = true,
  allowedRoles,
}) => {
  const { colors } = useTheme();
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(value);

  useEffect(() => {
    if (customerId) {
      loadRepresentatives();
    }
  }, [customerId]);

  useEffect(() => {
    setSelectedIds(value);
  }, [value]);

  const loadRepresentatives = async () => {
    setLoading(true);
    try {
      const reps = await representativeService.getByCustomer(customerId);

      // Filter by allowed roles if specified
      const filteredReps = allowedRoles
        ? reps.filter(r => allowedRoles.includes(r.role))
        : reps;

      setRepresentatives(filteredReps);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar representantes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (representativeId: string) => {
    if (multiple) {
      const newSelection = selectedIds.includes(representativeId)
        ? selectedIds.filter(id => id !== representativeId)
        : [...selectedIds, representativeId];
      setSelectedIds(newSelection);
    } else {
      setSelectedIds([representativeId]);
      setModalVisible(false);
      onChange([representativeId]);
    }
  };

  const handleConfirm = () => {
    onChange(selectedIds);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setSelectedIds(value);
    setModalVisible(false);
  };

  const getSelectedRepresentatives = () => {
    return representatives.filter(r => value.includes(r.id));
  };

  const groupedRepresentatives = representatives.reduce((acc, rep) => {
    if (!acc[rep.role]) {
      acc[rep.role] = [];
    }
    acc[rep.role].push(rep);
    return acc;
  }, {} as Record<RepresentativeRole, Representative[]>);

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    required: {
      color: colors.error,
    },
    selector: {
      borderWidth: 1,
      borderColor: error ? colors.error : colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: disabled ? colors.background : colors.card,
      minHeight: 48,
    },
    selectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    placeholder: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    selectedContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    chipText: {
      fontSize: 12,
      color: colors.primary,
      marginRight: 4,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      flex: 1,
      backgroundColor: colors.card,
      marginTop: 100,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    roleHeader: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
    },
    representativeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    representativeInfo: {
      flex: 1,
      marginLeft: 12,
    },
    representativeName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    representativePhone: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    cancelButtonText: {
      color: colors.text,
    },
    confirmButtonText: {
      color: '#FFFFFF',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={styles.selector}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          {value.length === 0 ? (
            <Text style={styles.placeholder}>Selecione representantes...</Text>
          ) : (
            <View style={styles.selectedContainer}>
              {getSelectedRepresentatives().map((rep) => (
                <View key={rep.id} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {rep.name} ({REPRESENTATIVE_ROLE_LABELS[rep.role]})
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : representatives.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-outline"
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    Nenhum representante cadastrado{'\n'}para este cliente
                  </Text>
                </View>
              ) : (
                Object.entries(groupedRepresentatives).map(([role, reps]) => (
                  <View key={role}>
                    <Text style={styles.roleHeader}>
                      {REPRESENTATIVE_ROLE_LABELS[role as RepresentativeRole]}
                    </Text>
                    {reps.map((rep) => (
                      <TouchableOpacity
                        key={rep.id}
                        style={styles.representativeItem}
                        onPress={() => handleSelect(rep.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedIds.includes(rep.id) && styles.checkboxChecked,
                          ]}
                        >
                          {selectedIds.includes(rep.id) && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <View style={styles.representativeInfo}>
                          <Text style={styles.representativeName}>{rep.name}</Text>
                          <Text style={styles.representativePhone}>
                            {rep.phone}
                            {rep.email && ` • ${rep.email}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>

            {multiple && representatives.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.buttonText, styles.confirmButtonText]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};