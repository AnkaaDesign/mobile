import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { spacing, borderRadius } from '@/constants/design-system';
import { IconX, IconLayoutGrid } from '@tabler/icons-react-native';
import type { ContentBlock } from './types';

interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: ContentBlock[];
}

// ─── Block type labels for badges ────────────────────────────────────────────
const BLOCK_LABELS: Partial<Record<ContentBlock['type'], string>> = {
  'company-asset': 'Logo',
  heading1: 'Título',
  heading2: 'Título',
  heading3: 'Título',
  paragraph: 'Texto',
  list: 'Lista',
  button: 'Botão',
  image: 'Imagem',
  quote: 'Citação',
  divider: 'Divisor',
  decorator: 'Rodapé',
  icon: 'Ícone',
};

const uniqueBlockBadges = (blocks: ContentBlock[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const b of blocks) {
    const label = BLOCK_LABELS[b.type];
    if (label && !seen.has(label)) {
      seen.add(label);
      result.push(label);
    }
  }
  return result;
};

// ─── Template data ────────────────────────────────────────────────────────────
const TEMPLATES: MessageTemplate[] = [
  {
    id: 'comunicado-geral',
    name: 'Comunicado Geral',
    description: 'Comunicado estruturado com contexto, detalhes e encerramento formal',
    category: 'Anúncio',
    blocks: [
      { id: 'tg1-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'tg1-2', type: 'heading1', content: 'Comunicado Geral', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'tg1-3', type: 'paragraph', content: '[Assunto do Comunicado]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'tg1-4', type: 'divider' },
      { id: 'tg1-5', type: 'heading3', content: 'Prezados Colaboradores,', fontSize: 'lg', fontWeight: 'semibold' },
      { id: 'tg1-6', type: 'paragraph', content: 'Vimos por meio deste comunicado informar sobre [descreva aqui o assunto principal]. É importante que todos tomem conhecimento e ajam conforme as orientações a seguir.', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg1-7', type: 'divider' },
      { id: 'tg1-8', type: 'heading3', content: 'Informações Importantes', fontSize: 'lg', fontWeight: 'semibold' },
      { id: 'tg1-9', type: 'list', items: ['**Data:** [inserir data]', '**Local:** [inserir local ou setor]', '**Responsável:** [inserir nome e cargo]', '**Prazo:** [inserir prazo para ação]'], ordered: false },
      { id: 'tg1-10', type: 'spacer', height: 'sm' },
      { id: 'tg1-11', type: 'quote', content: 'Contamos com a participação e colaboração de todos para o bom andamento desta iniciativa.' },
      { id: 'tg1-12', type: 'divider' },
      { id: 'tg1-13', type: 'paragraph', content: 'Para dúvidas, entre em contato com [departamento] pelo ramal [número].\n\nAtenciosamente,\n[Nome e Cargo] — [Departamento]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'tg1-14', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
  {
    id: 'aviso-urgente',
    name: 'Aviso Urgente',
    description: 'Alerta com ações obrigatórias, prazo e botão de confirmação de ciência',
    category: 'Aviso',
    blocks: [
      { id: 'tg2-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'tg2-2', type: 'heading1', content: '⚠️ Aviso Urgente', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'tg2-3', type: 'paragraph', content: 'Esta mensagem requer atenção imediata de todos os colaboradores. Leia com atenção e siga as orientações abaixo.', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg2-4', type: 'divider' },
      { id: 'tg2-5', type: 'heading2', content: 'Situação', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg2-6', type: 'paragraph', content: '[Descreva aqui a situação que motivou o aviso. Seja direto, claro e objetivo. Inclua o impacto esperado caso as instruções não sejam seguidas.]', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg2-7', type: 'heading3', content: 'Ações Necessárias', fontSize: 'lg', fontWeight: 'semibold' },
      { id: 'tg2-8', type: 'list', items: ['[Primeira ação: descrever o que deve ser feito]', '[Segunda ação: descrever o que deve ser feito]', '[Terceira ação: descrever o que deve ser feito]', '[Quarta ação — se necessário]'], ordered: true },
      { id: 'tg2-9', type: 'spacer', height: 'sm' },
      { id: 'tg2-10', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
  {
    id: 'boas-vindas',
    name: 'Boas-Vindas',
    description: 'Recepção calorosa com primeiros passos e benefícios para novos colaboradores',
    category: 'RH',
    blocks: [
      { id: 'tg4-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'tg4-2', type: 'heading1', content: 'Seja Bem-Vindo(a)! 🎉', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'tg4-3', type: 'heading3', content: 'Estamos muito felizes em tê-lo(a) em nossa equipe!', fontSize: 'lg', fontWeight: 'semibold' },
      { id: 'tg4-4', type: 'paragraph', content: 'É com grande satisfação que recebemos você em nosso time. Sua trajetória e habilidades serão fundamentais para o crescimento de todos. Esperamos que esta jornada seja repleta de aprendizado, colaboração e conquistas.', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg4-5', type: 'divider' },
      { id: 'tg4-6', type: 'heading2', content: 'Primeiros Passos', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg4-7', type: 'list', items: ['Acesse o portal do colaborador e configure seu perfil completo', 'Apresente-se à sua equipe e agende uma reunião de alinhamento com seu gestor', 'Leia o manual do colaborador disponível no portal interno', 'Entre em contato com o RH para finalizar a entrega de documentação'], ordered: true },
      { id: 'tg4-8', type: 'divider' },
      { id: 'tg4-9', type: 'heading2', content: 'Seus Benefícios', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg4-10', type: 'list', items: ['Plano de saúde e odontológico extensivo à família', 'Vale-refeição e vale-transporte', 'Plano de desenvolvimento e capacitação contínua', 'Horário flexível após período de adaptação (90 dias)'], ordered: false },
      { id: 'tg4-11', type: 'spacer', height: 'sm' },
      { id: 'tg4-12', type: 'quote', content: '"A nossa empresa é feita de pessoas. Seja muito bem-vindo(a) à família!"' },
      { id: 'tg4-13', type: 'spacer', height: 'sm' },
      { id: 'tg4-14', type: 'button', text: 'Acessar Portal do Colaborador', url: '#', variant: 'default', alignment: 'center' },
      { id: 'tg4-15', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
  {
    id: 'convite-evento',
    name: 'Convite / Evento',
    description: 'Convite completo com detalhes, programação e confirmação de presença',
    category: 'Evento',
    blocks: [
      { id: 'tg5-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'tg5-2', type: 'heading1', content: 'Você Está Convidado(a)! 🎊', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'tg5-3', type: 'paragraph', content: 'Temos o prazer de convidá-lo(a) para um evento especial. A sua presença é muito importante e tornará este momento ainda mais significativo para todos nós.', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg5-4', type: 'divider' },
      { id: 'tg5-5', type: 'heading2', content: 'Detalhes do Evento', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg5-6', type: 'list', items: ['📅 Data: [inserir data]', '🕐 Horário: [inserir horário de início e término]', '📍 Local: [inserir endereço completo]'], ordered: false },
      { id: 'tg5-7', type: 'divider' },
      { id: 'tg5-8', type: 'heading2', content: 'Programação', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg5-9', type: 'list', items: ['[Horário] — Recepção e credenciamento', '[Horário] — Abertura e boas-vindas', '[Horário] — [Atividade ou atração principal]', '[Horário] — Coffee break / Intervalo', '[Horário] — Encerramento e confraternização'], ordered: true },
      { id: 'tg5-10', type: 'spacer', height: 'sm' },
      { id: 'tg5-11', type: 'quote', content: 'Contamos com a sua presença para tornar este evento inesquecível!' },
      { id: 'tg5-12', type: 'spacer', height: 'sm' },
      { id: 'tg5-13', type: 'button', text: 'Confirmar Presença', url: '#', variant: 'default', alignment: 'center' },
      { id: 'tg5-14', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
  {
    id: 'politica-interna',
    name: 'Política Interna',
    description: 'Documento formal com objetivo, abrangência, diretrizes e responsabilidades',
    category: 'Normativo',
    blocks: [
      { id: 'tg7-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'tg7-2', type: 'heading1', content: 'Política Interna', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'tg7-3', type: 'paragraph', content: '[Nome da Política]\nVersão: 1.0  ·  Vigência: [Data]  ·  Responsável: [Departamento]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'tg7-4', type: 'divider' },
      { id: 'tg7-5', type: 'heading2', content: '1. Objetivo', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg7-6', type: 'paragraph', content: 'Esta política tem como objetivo estabelecer diretrizes e procedimentos para [descrever o escopo], garantindo [descrever o benefício esperado].', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg7-7', type: 'heading2', content: '2. Abrangência', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg7-8', type: 'paragraph', content: 'Esta política aplica-se a todos os colaboradores, prestadores de serviço e parceiros que [descrever o escopo de aplicação].', fontSize: 'base', fontWeight: 'normal' },
      { id: 'tg7-9', type: 'heading2', content: '3. Diretrizes', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg7-10', type: 'list', items: ['[Diretriz 1]: descrição completa e seu impacto na operação', '[Diretriz 2]: descrição completa e seu impacto na operação', '[Diretriz 3]: descrição completa e seu impacto na operação', '[Diretriz 4]: descrição completa e seu impacto na operação'], ordered: true },
      { id: 'tg7-11', type: 'heading2', content: '4. Responsabilidades', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'tg7-12', type: 'list', items: ['Gestores: [responsabilidades específicas de liderança]', 'Colaboradores: [responsabilidades individuais e de cumprimento]', 'RH / Compliance: [responsabilidades de fiscalização e apoio]'], ordered: false },
      { id: 'tg7-13', type: 'divider' },
      { id: 'tg7-14', type: 'quote', content: 'O descumprimento desta política estará sujeito às medidas disciplinares previstas no regulamento interno da empresa.' },
      { id: 'tg7-15', type: 'spacer', height: 'sm' },
      { id: 'tg7-16', type: 'paragraph', content: 'Este documento entra em vigor na data de sua publicação e substitui versões anteriores.\n\n[Nome do Responsável]\n[Cargo] — [Departamento]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'tg7-17', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
  {
    id: 'ata-reuniao',
    name: 'Ata de Reunião',
    description: 'Registro formal com participantes, pauta, decisões e encaminhamentos',
    category: 'Ata',
    blocks: [
      { id: 'ta1-1', type: 'company-asset', asset: 'logo', size: '128px', alignment: 'left' },
      { id: 'ta1-2', type: 'heading1', content: 'Ata de Reunião', fontSize: '2xl', fontWeight: 'bold' },
      { id: 'ta1-3', type: 'paragraph', content: 'Reunião: [Tipo / Título]\nData: [Data]  ·  Horário: [Início] às [Término]\nLocal: [Sala / Link da videochamada]\nModerador: [Nome e Cargo]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'ta1-4', type: 'divider' },
      { id: 'ta1-5', type: 'heading2', content: 'Participantes', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'ta1-6', type: 'list', items: ['[Nome 1] — [Cargo / Departamento]', '[Nome 2] — [Cargo / Departamento]', '[Nome 3] — [Cargo / Departamento]', '[Nome 4] — [Cargo / Departamento]'], ordered: false },
      { id: 'ta1-7', type: 'divider' },
      { id: 'ta1-8', type: 'heading2', content: 'Pauta', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'ta1-9', type: 'list', items: ['[Item 1 da pauta]', '[Item 2 da pauta]', '[Item 3 da pauta]'], ordered: true },
      { id: 'ta1-10', type: 'divider' },
      { id: 'ta1-11', type: 'heading2', content: 'Deliberações e Decisões', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'ta1-12', type: 'list', items: ['[Decisão 1]: descrição da decisão tomada e encaminhamento definido', '[Decisão 2]: descrição da decisão tomada e encaminhamento definido', '[Decisão 3]: descrição da decisão tomada e encaminhamento definido'], ordered: false },
      { id: 'ta1-13', type: 'divider' },
      { id: 'ta1-14', type: 'heading2', content: 'Encaminhamentos', fontSize: 'xl', fontWeight: 'semibold' },
      { id: 'ta1-15', type: 'list', items: ['[Ação 1] — Responsável: [Nome] — Prazo: [Data]', '[Ação 2] — Responsável: [Nome] — Prazo: [Data]', '[Ação 3] — Responsável: [Nome] — Prazo: [Data]'], ordered: true },
      { id: 'ta1-16', type: 'divider' },
      { id: 'ta1-17', type: 'heading3', content: 'Próxima Reunião', fontSize: 'lg', fontWeight: 'semibold' },
      { id: 'ta1-18', type: 'paragraph', content: 'Data: [Data prevista]  ·  Horário: [Horário]  ·  Local: [Local / Link]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'ta1-19', type: 'spacer', height: 'sm' },
      { id: 'ta1-20', type: 'paragraph', content: 'Ata lavrada e aprovada pelos participantes em [Data].\n\n[Nome do Moderador]\n[Cargo] — [Departamento]', fontSize: 'sm', fontWeight: 'normal' },
      { id: 'ta1-21', type: 'decorator', variant: 'footer-wave-dark' },
    ],
  },
];

interface MessageTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (blocks: ContentBlock[]) => void;
  hasExistingBlocks: boolean;
}

export function MessageTemplatesModal({
  visible,
  onClose,
  onSelect,
  hasExistingBlocks,
}: MessageTemplatesModalProps) {
  const { colors } = useTheme();
  const [confirmTemplate, setConfirmTemplate] = useState<MessageTemplate | null>(null);

  const handleSelectTemplate = (template: MessageTemplate) => {
    if (hasExistingBlocks) {
      setConfirmTemplate(template);
    } else {
      applyTemplate(template);
    }
  };

  const applyTemplate = (template: MessageTemplate) => {
    const blocksWithNewIds: ContentBlock[] = template.blocks.map((block) => ({
      ...block,
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    } as ContentBlock));
    onSelect(blocksWithNewIds);
    onClose();
    setConfirmTemplate(null);
  };

  const handleClose = () => {
    onClose();
    setConfirmTemplate(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <IconLayoutGrid size={20} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Exemplos de Mensagem
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={8}>
            <IconX size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {confirmTemplate ? (
          /* ── Confirmation view ── */
          <View style={styles.confirmContainer}>
            <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>
              {'Você já possui blocos no editor. Ao aplicar o template '}
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>
                "{confirmTemplate.name}"
              </Text>
              {', todos os blocos atuais serão substituídos.'}
            </Text>
            <Text style={[styles.confirmText, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
              Deseja continuar?
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnOutline, { borderColor: colors.border }]}
                onPress={() => setConfirmTemplate(null)}
              >
                <Text style={[styles.confirmBtnText, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnPrimary, { backgroundColor: colors.primary }]}
                onPress={() => applyTemplate(confirmTemplate)}
              >
                <Text style={[styles.confirmBtnText, { color: '#ffffff' }]}>Substituir e Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── Template grid ── */
          <>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Toque em um modelo para aplicá-lo ao editor
            </Text>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.grid}>
                {TEMPLATES.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => handleSelectTemplate(template)}
                    activeOpacity={0.75}
                  >
                    {/* Title + category badge */}
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                        {template.name}
                      </Text>
                      <View style={[styles.categoryBadge, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.categoryText, { color: colors.mutedForeground }]}>
                          {template.category}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={[styles.cardDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {template.description}
                    </Text>

                    {/* Block type badges */}
                    <View style={styles.blockBadges}>
                      {uniqueBlockBadges(template.blocks).map((label) => (
                        <View key={label} style={[styles.blockBadge, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.blockBadgeText, { color: colors.mutedForeground }]}>
                            {label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  cardName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  blockBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  blockBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  blockBadgeText: {
    fontSize: 10,
    fontWeight: '400',
  },
  // Confirmation dialog styles
  confirmContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 14,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  confirmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnOutline: {
    borderWidth: 1,
  },
  confirmBtnPrimary: {},
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
