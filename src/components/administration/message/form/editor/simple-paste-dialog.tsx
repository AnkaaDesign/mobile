import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/ui/themed-text';
import { IconClipboardText, IconTrash } from '@tabler/icons-react-native';
import { clipboardToContentBlocks } from '@/utils/message-rich-paste';
import type { ContentBlock } from './types';

interface SimplePasteDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives the content blocks parsed from the clipboard (logo/footer added by the caller). */
  onInsert: (blocks: ContentBlock[]) => void;
}

// Plain-text preview of what was captured, so the user can confirm before inserting.
function plainPreview(input: { html?: string; text?: string }): string {
  if (input.text && input.text.trim()) return input.text.trim();
  const html = (input.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return html;
}

function summarize(blocks: ContentBlock[]): string {
  const counts: Record<string, number> = {};
  for (const b of blocks) counts[b.type] = (counts[b.type] || 0) + 1;
  const parts: string[] = [];
  const headings = (counts.heading1 || 0) + (counts.heading2 || 0);
  if (headings) parts.push(`${headings} título${headings > 1 ? 's' : ''}`);
  if (counts.paragraph) parts.push(`${counts.paragraph} parágrafo${counts.paragraph > 1 ? 's' : ''}`);
  if (counts.list) parts.push(`${counts.list} lista${counts.list > 1 ? 's' : ''}`);
  if (counts.quote) parts.push(`${counts.quote} citação${counts.quote > 1 ? 'ões' : ''}`);
  return parts.join(' · ');
}

export function SimplePasteDialog({ open, onClose, onInsert }: SimplePasteDialogProps) {
  const { colors } = useTheme();
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setBlocks([]);
    setPreview('');
    setError(null);
  }, []);

  const handlePaste = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Prefer HTML (preserves bold/italic/lists); fall back to plain text.
      let html = '';
      try {
        html = await Clipboard.getStringAsync({ preferredFormat: Clipboard.StringFormat.HTML });
      } catch {
        html = '';
      }
      const text = await Clipboard.getStringAsync();
      const parsed = clipboardToContentBlocks({ html, text });
      if (!parsed.length) {
        reset();
        setError('Nada para colar. Copie um texto e tente novamente.');
        return;
      }
      setBlocks(parsed);
      setPreview(plainPreview({ html, text }));
    } catch {
      setError('Não foi possível ler a área de transferência.');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleInsert = useCallback(() => {
    if (!blocks.length) return;
    onInsert(blocks);
    reset();
    onClose();
  }, [blocks, onInsert, reset, onClose]);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()} snapPoints={[80]}>
      <SheetContent style={styles.sheetContent}>
        <SheetHeader style={{ borderBottomColor: colors.border }}>
          <View style={styles.titleRow}>
            <IconClipboardText size={20} color={colors.primary} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Colar conteúdo formatado
            </ThemedText>
          </View>
          <ThemedText style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Cole um texto já formatado. Negrito, itálico, listas e o espaçamento serão preservados.
            O logo no topo e o rodapé serão adicionados automaticamente.
          </ThemedText>
        </SheetHeader>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Button
            variant="default"
            onPress={handlePaste}
            disabled={loading}
            icon={loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <IconClipboardText size={18} color="#FFFFFF" />}
          >
            {loading ? 'Lendo...' : 'Colar da área de transferência'}
          </Button>

          {error && (
            <ThemedText style={[styles.error, { color: colors.destructive }]}>{error}</ThemedText>
          )}

          {blocks.length > 0 && (
            <>
              <ThemedText style={[styles.summary, { color: colors.mutedForeground }]}>
                Detectado: {summarize(blocks)}
              </ThemedText>
              <View style={[styles.previewBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <ScrollView nestedScrollEnabled style={styles.previewScroll}>
                  <ThemedText style={[styles.previewText, { color: colors.foreground }]}>
                    {preview}
                  </ThemedText>
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {blocks.length > 0 && (
            <Button
              variant="ghost"
              onPress={reset}
              icon={<IconTrash size={16} color={colors.mutedForeground} />}
            >
              Limpar
            </Button>
          )}
          <View style={styles.footerSpacer} />
          <Button variant="outline" onPress={handleClose}>
            Cancelar
          </Button>
          <Button variant="default" onPress={handleInsert} disabled={!blocks.length}>
            Inserir
          </Button>
        </View>
      </SheetContent>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  error: {
    fontSize: 13,
  },
  summary: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewBox: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 220,
  },
  previewScroll: {
    flexGrow: 0,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerSpacer: {
    flex: 1,
  },
});
