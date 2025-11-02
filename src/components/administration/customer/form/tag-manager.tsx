import { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconPlus, IconX, IconTag } from "@tabler/icons-react-native";
import { ThemedText, Input, Button } from "@/components/ui";
import { useTheme } from "@/lib/theme";

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagManager({ tags, onChange }: TagManagerProps) {
  const { colors } = useTheme();
  const [newTag, setNewTag] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;

    // Convert to uppercase for consistency
    const normalizedTag = trimmedTag.toUpperCase();

    if (!tags.includes(normalizedTag)) {
      onChange([...tags, normalizedTag]);
    }

    setNewTag("");
    setIsAdding(false);
  };

  const handleRemoveTag = (index: number) => {
    const updatedTags = tags.filter((_, i) => i !== index);
    onChange(updatedTags);
  };

  return (
    <View style={styles.container}>
      {/* Tag List */}
      {tags.length > 0 && (
        <View style={styles.tagList}>
          {tags.map((tag, index) => (
            <View key={index} style={[styles.tagItem, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <View style={styles.tagInfo}>
                <IconTag size={14} color="white" />
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
              <TouchableOpacity onPress={() => handleRemoveTag(index)} style={styles.removeButton}>
                <IconX size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add Tag Input */}
      {isAdding ? (
        <View style={styles.addTagContainer}>
          <Input
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Digite a tag"
            maxLength={50}
            autoFocus
            autoCapitalize="characters"
            style={styles.tagInput}
            onSubmitEditing={handleAddTag}
          />
          <View style={styles.addTagActions}>
            <Button variant="outline" size="sm" onPress={() => setIsAdding(false)} style={styles.addTagButton}>
              <ThemedText>Cancelar</ThemedText>
            </Button>
            <Button variant="default" size="sm" onPress={handleAddTag} style={styles.addTagButton}>
              <ThemedText style={{ color: "white" }}>Adicionar</ThemedText>
            </Button>
          </View>
        </View>
      ) : (
        <Button variant="outline" onPress={() => setIsAdding(true)} style={styles.addButton}>
          <IconPlus size={16} color={colors.foreground} />
          <ThemedText>Adicionar Tag</ThemedText>
        </Button>
      )}

      {tags.length === 0 && !isAdding && (
        <ThemedText style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma tag cadastrada</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  removeButton: {
    padding: 2,
  },
  addTagContainer: {
    gap: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagActions: {
    flexDirection: "row",
    gap: 8,
  },
  addTagButton: {
    flex: 1,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
  },
});
