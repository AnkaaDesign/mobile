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
import { IconChevronDown, IconX, IconUsers, IconCheck } from '@tabler/icons-react-native';
import { responsibleService } from '@/services/responsibleService';
import {
  Responsible,
  ResponsibleRole,
  RESPONSIBLE_ROLE_LABELS,
  RESPONSIBLE_ROLE_COLORS,
} from '@/types/responsible';
import { useTheme } from '@/lib/theme';

interface ResponsibleSelectorProps {
  companyId: string;
  value: string[]; // Array of responsible IDs
  onChange: (responsibleIds: string[]) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  multiple?: boolean;
  allowedRoles?: ResponsibleRole[];
}

export const ResponsibleSelector: React.FC<ResponsibleSelectorProps> = ({
  companyId,
  value = [],
  onChange,
  error,
  disabled,
  label = 'Responsáveis',
  required = false,
  multiple = true,
  allowedRoles,
}) => {
  const { colors } = useTheme();
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(value);

  useEffect(() => {
    if (companyId) {
      loadResponsibles();
    }
  }, [companyId]);

  useEffect(() => {
    setSelectedIds(value);
  }, [value]);

  const loadResponsibles = async () => {
    setLoading(true);
    try {
      const resps = await responsibleService.getByCompany(companyId);

      // Filter by allowed roles if specified
      const filteredResps = allowedRoles
        ? resps.filter(r => allowedRoles.includes(r.role))
        : resps;

      setResponsibles(filteredResps);
    } catch (error: any) {
      Alert.alert('Erro', 'Erro ao carregar responsáveis');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (responsibleId: string) => {
    if (multiple) {
      const newSelection = selectedIds.includes(responsibleId)
        ? selectedIds.filter(id => id !== responsibleId)
        : [...selectedIds, responsibleId];
      setSelectedIds(newSelection);
    } else {
      setSelectedIds([responsibleId]);
      setModalVisible(false);
      onChange([responsibleId]);
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

  const getSelectedResponsibles = () => {
    return responsibles.filter(r => value.includes(r.id));
  };

  const groupedResponsibles = responsibles.reduce((acc, resp) => {
    if (!acc[resp.role]) {
      acc[resp.role] = [];
    }
    acc[resp.role].push(resp);
    return acc;
  }, {} as Record<ResponsibleRole, Responsible[]>);

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
    responsibleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    responsibleInfo: {
      flex: 1,
      marginLeft: 12,
    },
    responsibleName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    responsiblePhone: {
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
            <Text style={styles.placeholder}>Selecione responsáveis...</Text>
          ) : (
            <View style={styles.selectedContainer}>
              {getSelectedResponsibles().map((resp) => (
                <View key={resp.id} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {resp.name} ({RESPONSIBLE_ROLE_LABELS[resp.role]})
                  </Text>
                </View>
              ))}
            </View>
          )}
          <IconChevronDown
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
                <IconX size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.emptyState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : responsibles.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconUsers
                    size={48}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.emptyText}>
                    Nenhum responsável cadastrado{'\n'}para esta empresa
                  </Text>
                </View>
              ) : (
                Object.entries(groupedResponsibles).map(([role, resps]) => (
                  <View key={role}>
                    <Text style={styles.roleHeader}>
                      {RESPONSIBLE_ROLE_LABELS[role as ResponsibleRole]}
                    </Text>
                    {resps.map((resp) => (
                      <TouchableOpacity
                        key={resp.id}
                        style={styles.responsibleItem}
                        onPress={() => handleSelect(resp.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            selectedIds.includes(resp.id) && styles.checkboxChecked,
                          ]}
                        >
                          {selectedIds.includes(resp.id) && (
                            <IconCheck size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <View style={styles.responsibleInfo}>
                          <Text style={styles.responsibleName}>{resp.name}</Text>
                          <Text style={styles.responsiblePhone}>
                            {resp.phone}
                            {resp.email && ` • ${resp.email}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>

            {multiple && responsibles.length > 0 && (
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
