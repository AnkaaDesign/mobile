import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";
import type { LayoutCreateFormData } from "@/schemas";
import { showToast } from "@/components/ui/toast";

interface LayoutFormProps {
  selectedSide: 'left' | 'right' | 'back';
  layouts: {
    left?: LayoutCreateFormData;
    right?: LayoutCreateFormData;
    back?: LayoutCreateFormData;
  };
  onChange: (side: 'left' | 'right' | 'back', data: LayoutCreateFormData) => void;
  disabled?: boolean;
}

interface Door {
  id: string;
  position: number; // Position from left edge in cm
  width: number; // Door width in cm
  offsetTop: number; // Space from top in cm
}

interface SideState {
  height: number;
  totalWidth: number;
  doors: Door[];
  photoUri?: string;
}

export function LayoutForm({ selectedSide, layouts, onChange, disabled = false }: LayoutFormProps) {
  const { colors } = useTheme();

  // Initialize side states from layouts prop
  const [sideStates, setSideStates] = useState<Record<'left' | 'right' | 'back', SideState>>(() => {
    const initialStates: Record<'left' | 'right' | 'back', SideState> = {
      left: { height: 240, totalWidth: 800, doors: [] },
      right: { height: 240, totalWidth: 800, doors: [] },
      back: { height: 242, totalWidth: 242, doors: [] }
    };

    // Initialize from layouts prop if available
    Object.keys(layouts).forEach((side) => {
      const layoutData = layouts[side as 'left' | 'right' | 'back'];
      if (layoutData?.sections) {
        const state: SideState = {
          height: (layoutData.height || 2.4) * 100,
          totalWidth: 0,
          doors: []
        };

        const sections = layoutData.sections;
        const total = sections.reduce((sum, s) => sum + s.width * 100, 0);
        state.totalWidth = total || 800;

        // Extract doors from sections
        const extractedDoors: Door[] = [];
        let currentPos = 0;

        sections.forEach((section, idx) => {
          if (section.isDoor) {
            extractedDoors.push({
              id: `door-${side}-${idx}-${Date.now()}`,
              position: currentPos,
              width: section.width * 100,
              offsetTop: (section.doorOffset || 0.5) * 100
            });
          }
          currentPos += section.width * 100;
        });

        state.doors = extractedDoors;
        initialStates[side as 'left' | 'right' | 'back'] = state;
      }
    });

    return initialStates;
  });

  const currentState = sideStates[selectedSide];

  // Calculate segments (sections between doors)
  const calculateSegments = (doors: Door[], totalWidth: number) => {
    if (doors.length === 0) {
      return [{
        type: 'segment',
        start: 0,
        end: totalWidth,
        width: Math.round(totalWidth)
      }];
    }

    const sortedDoors = [...doors].sort((a, b) => a.position - b.position);
    const segments: any[] = [];
    let currentPos = 0;

    sortedDoors.forEach((door) => {
      if (door.position > currentPos) {
        segments.push({
          type: 'segment',
          start: currentPos,
          end: door.position,
          width: Math.round(door.position - currentPos)
        });
      }

      segments.push({
        type: 'door',
        start: door.position,
        end: door.position + door.width,
        width: Math.round(door.width),
        door: door
      });

      currentPos = door.position + door.width;
    });

    if (currentPos < totalWidth) {
      segments.push({
        type: 'segment',
        start: currentPos,
        end: totalWidth,
        width: Math.round(totalWidth - currentPos)
      });
    }

    return segments;
  };

  const segments = useMemo(() => {
    if (!currentState) return [];
    return calculateSegments(currentState.doors, currentState.totalWidth);
  }, [currentState]);

  // Update current side and emit changes
  const updateCurrentSide = useCallback((updates: Partial<SideState>) => {
    setSideStates(prev => {
      const newState = {
        ...prev,
        [selectedSide]: {
          ...prev[selectedSide],
          ...updates
        }
      };

      const state = newState[selectedSide];
      const updatedSegments = calculateSegments(state.doors, state.totalWidth);

      const sections = updatedSegments.map((segment, index) => ({
        width: segment.width / 100,
        isDoor: segment.type === 'door',
        doorOffset: segment.type === 'door' && segment.door ? segment.door.offsetTop / 100 : null,
        position: index
      }));

      const layoutData: LayoutCreateFormData = {
        height: state.height / 100,
        sections,
        photoId: null,
      };

      onChange(selectedSide, layoutData);
      return newState;
    });
  }, [selectedSide, onChange]);

  // Add a new door
  const addDoor = useCallback(() => {
    if (!currentState || selectedSide === 'back') return;

    const doorWidth = 100;
    const doorOffset = 50;

    const newDoor = {
      id: `door-${selectedSide}-${Date.now()}`,
      position: Math.max(0, (currentState.totalWidth - doorWidth) / 2),
      width: doorWidth,
      offsetTop: doorOffset
    };

    updateCurrentSide({ doors: [...currentState.doors, newDoor] });
  }, [currentState, selectedSide, updateCurrentSide]);

  // Remove door
  const removeDoor = useCallback((doorId: string) => {
    if (!currentState) return;
    updateCurrentSide({ doors: currentState.doors.filter(d => d.id !== doorId) });
  }, [currentState, updateCurrentSide]);

  // Update door offset
  const updateDoorOffset = useCallback((doorId: string, offsetText: string) => {
    if (!currentState) return;

    // Parse the value - handle commas and convert to cm
    let offsetCm = 0;
    if (offsetText && offsetText.trim() !== '') {
      const normalizedText = offsetText.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      if (!isNaN(parsed)) {
        offsetCm = parsed * 100; // Convert meters to cm
      }
    }

    offsetCm = Math.max(0, Math.min(currentState.height - 50, offsetCm));

    const updatedDoors = currentState.doors.map(d =>
      d.id === doorId ? { ...d, offsetTop: offsetCm } : d
    );
    updateCurrentSide({ doors: updatedDoors });
  }, [currentState, updateCurrentSide]);

  // Update section width (simplified - just user input with commas)
  const updateSectionWidth = useCallback((index: number, widthText: string) => {
    const segment = segments[index];
    if (!segment) return;

    // Parse the value - handle commas and convert to cm
    let widthCm = 0;
    if (widthText && widthText.trim() !== '') {
      const normalizedText = widthText.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      if (!isNaN(parsed)) {
        widthCm = parsed * 100; // Convert meters to cm
      }
    }

    widthCm = Math.max(50, widthCm); // Minimum 50cm

    const oldWidth = segment.width;
    const widthDiff = widthCm - oldWidth;

    if (segment.type === 'door' && segment.door) {
      // Update door width
      const updatedDoors = currentState.doors.map(d =>
        d.id === segment.door.id ? { ...d, width: widthCm } : d
      );
      updateCurrentSide({
        doors: updatedDoors,
        totalWidth: Math.max(100, currentState.totalWidth + widthDiff)
      });
    } else {
      // Update segment - if last segment, change total width
      if (index === segments.length - 1) {
        updateCurrentSide({ totalWidth: Math.max(100, currentState.totalWidth + widthDiff) });
      } else {
        // Shift doors after this segment
        const sortedDoors = [...currentState.doors].sort((a, b) => a.position - b.position);
        const newDoors = sortedDoors.map(door => {
          if (door.position >= segment.end) {
            return { ...door, position: Math.max(0, door.position + widthDiff) };
          }
          return door;
        });

        updateCurrentSide({
          doors: newDoors,
          totalWidth: Math.max(100, currentState.totalWidth + widthDiff)
        });
      }
    }
  }, [segments, currentState, updateCurrentSide]);

  // Update height (simplified - just user input with commas)
  const updateHeight = useCallback((heightText: string) => {
    // Parse the value - handle commas and convert to cm
    let heightCm = 240; // Default
    if (heightText && heightText.trim() !== '') {
      const normalizedText = heightText.replace(',', '.');
      const parsed = parseFloat(normalizedText);
      if (!isNaN(parsed)) {
        heightCm = parsed * 100; // Convert meters to cm
      }
    }

    heightCm = Math.max(100, Math.min(400, heightCm));
    updateCurrentSide({ height: heightCm });
  }, [updateCurrentSide]);

  // Handle photo upload for back side
  const handlePhotoUpload = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'Precisamos de permissão para acessar a câmera.',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Adicionar Foto',
        'Escolha uma opção',
        [
          {
            text: 'Tirar Foto',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setSideStates(prev => ({
                  ...prev,
                  [selectedSide]: {
                    ...prev[selectedSide],
                    photoUri: result.assets[0].uri
                  }
                }));
                showToast({ message: 'Foto adicionada com sucesso', type: 'success' });
              }
            }
          },
          {
            text: 'Escolher da Galeria',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setSideStates(prev => ({
                  ...prev,
                  [selectedSide]: {
                    ...prev[selectedSide],
                    photoUri: result.assets[0].uri
                  }
                }));
                showToast({ message: 'Foto adicionada com sucesso', type: 'success' });
              }
            }
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.error('Error picking image:', error);
      showToast({ message: 'Erro ao adicionar foto', type: 'error' });
    }
  }, [selectedSide]);

  // Calculate display scale for mobile
  const maxDisplayWidth = 300;
  const maxDisplayHeight = 120;
  const scale = Math.min(
    maxDisplayWidth / Math.max(currentState?.totalWidth || 800, 100),
    maxDisplayHeight / Math.max(currentState?.height || 240, 100),
    0.5
  );

  const getSideLabel = (side: 'left' | 'right' | 'back') => {
    switch (side) {
      case 'left': return 'Motorista';
      case 'right': return 'Sapo';
      case 'back': return 'Traseira';
    }
  };

  if (!currentState) {
    return (
      <View style={styles.container}>
        <ThemedText>Carregando layout...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Visual Layout Preview */}
      <View style={[styles.previewContainer, { borderColor: colors.border, backgroundColor: colors.muted }]}>
        <ThemedText style={styles.previewTitle}>{getSideLabel(selectedSide)}</ThemedText>

        <View style={styles.layoutWrapper}>
          {/* Main Rectangle */}
          <View
            style={[
              styles.layoutRect,
              {
                width: currentState.totalWidth * scale,
                height: currentState.height * scale,
                borderColor: colors.foreground,
                backgroundColor: currentState.photoUri ? 'transparent' : colors.background,
              }
            ]}
          >
            {/* Background photo for back side */}
            {selectedSide === 'back' && currentState.photoUri && (
              <View style={StyleSheet.absoluteFill}>
                <Image
                  source={{ uri: currentState.photoUri }}
                  style={{ width: '100%', height: '100%', opacity: 0.5 }}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Render doors (only for sides, not back) */}
            {selectedSide !== 'back' && currentState.doors.map(door => (
              <View key={door.id}>
                {/* Door left vertical line */}
                <View
                  style={{
                    position: 'absolute',
                    left: door.position * scale,
                    top: door.offsetTop * scale,
                    width: 2,
                    height: (currentState.height - door.offsetTop) * scale,
                    backgroundColor: colors.foreground,
                  }}
                />

                {/* Door right vertical line */}
                <View
                  style={{
                    position: 'absolute',
                    left: (door.position + door.width) * scale - 2,
                    top: door.offsetTop * scale,
                    width: 2,
                    height: (currentState.height - door.offsetTop) * scale,
                    backgroundColor: colors.foreground,
                  }}
                />

                {/* Door top horizontal line */}
                <View
                  style={{
                    position: 'absolute',
                    left: door.position * scale,
                    top: door.offsetTop * scale,
                    width: door.width * scale,
                    height: 2,
                    backgroundColor: colors.foreground,
                  }}
                />

                {/* Remove button */}
                <TouchableOpacity
                  style={[
                    styles.removeDoorButton,
                    {
                      left: (door.position + door.width / 2) * scale - 12,
                      top: (door.offsetTop + (currentState.height - door.offsetTop) / 2) * scale - 12,
                      backgroundColor: colors.destructive,
                    }
                  ]}
                  onPress={() => removeDoor(door.id)}
                  disabled={disabled}
                >
                  <Icon name="x" size={16} color={colors.destructiveForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Height Input */}
      <Card style={styles.inputCard}>
        <View style={styles.fieldRow}>
          <Text style={{ color: colors.foreground, fontSize: fontSize.sm, fontWeight: '500' }}>Altura</Text>
          <Input
            value={(currentState.height / 100).toFixed(2).replace('.', ',')}
            onChangeText={updateHeight}
            placeholder="2,40"
            keyboardType="decimal-pad"
            disabled={disabled}
            style={styles.rowInput}
          />
        </View>
      </Card>

      {/* Sections/Doors Width Inputs - Simplified */}
      {(() => {
        let sectionCounter = 0;
        let doorCounter = 0;

        return segments.map((segment, index) => {
          if (segment.type === 'door') {
            doorCounter++;
            return (
              <Card key={`segment-${index}`} style={styles.inputCard}>
                <View style={styles.fieldRow}>
                  <Text style={{ color: colors.foreground, fontSize: fontSize.sm, fontWeight: '500' }}>Porta {doorCounter}</Text>
                  <Input
                    value={(segment.width / 100).toFixed(2).replace('.', ',')}
                    onChangeText={(text) => updateSectionWidth(index, text)}
                    placeholder="1,00"
                    keyboardType="decimal-pad"
                    disabled={disabled}
                    style={styles.rowInput}
                  />
                </View>
              </Card>
            );
          } else {
            sectionCounter++;
            return (
              <Card key={`segment-${index}`} style={styles.inputCard}>
                <View style={styles.fieldRow}>
                  <Text style={{ color: colors.foreground, fontSize: fontSize.sm, fontWeight: '500' }}>Seção {sectionCounter}</Text>
                  <Input
                    value={(segment.width / 100).toFixed(2).replace('.', ',')}
                    onChangeText={(text) => updateSectionWidth(index, text)}
                    placeholder="1,00"
                    keyboardType="decimal-pad"
                    disabled={disabled}
                    style={styles.rowInput}
                  />
                </View>
              </Card>
            );
          }
        });
      })()}

      {/* Altura Porta - Always last, only shown for doors */}
      {selectedSide !== 'back' && currentState.doors.map((door, index) => (
        <Card key={door.id} style={styles.inputCard}>
          <View style={styles.fieldRow}>
            <Text style={{ color: colors.foreground, fontSize: fontSize.sm, fontWeight: '500' }}>Altura Porta {index + 1}</Text>
            <Input
              value={(door.offsetTop / 100).toFixed(2).replace('.', ',')}
              onChangeText={(text) => updateDoorOffset(door.id, text)}
              placeholder="0,50"
              keyboardType="decimal-pad"
              disabled={disabled}
              style={styles.rowInput}
            />
          </View>
        </Card>
      ))}

      {/* Add Door Button (only for sides) */}
      {selectedSide !== 'back' && (
        <Button
          variant="outline"
          onPress={addDoor}
          disabled={disabled}
          style={styles.addButton}
        >
          <Icon name="plus" size={16} color={colors.foreground} />
          <ThemedText style={{ marginLeft: spacing.xs }}>Adicionar Porta</ThemedText>
        </Button>
      )}

      {/* Add Photo Button (only for back) */}
      {selectedSide === 'back' && (
        <Button
          variant="outline"
          onPress={handlePhotoUpload}
          disabled={disabled}
          style={styles.addButton}
        >
          <Icon name="camera" size={16} color={colors.foreground} />
          <ThemedText style={{ marginLeft: spacing.xs }}>
            {currentState.photoUri ? 'Alterar Foto' : 'Adicionar Foto'}
          </ThemedText>
        </Button>
      )}

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  layoutWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  layoutRect: {
    borderWidth: 2,
    position: 'relative',
  },
  removeDoorButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCard: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowInput: {
    width: 80,
    height: 32,
    minHeight: 32,
  },
  addButton: {
    marginBottom: spacing.md,
  },
});
