import {
  IconAlertTriangle,
  IconCrosshair,
  IconFileText,
  IconHourglass,
  IconMapPin,
  IconPlus,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react-native";
import { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Dimensions,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/lib/theme";
import { useSlotContext } from "../chrome/slot-context";
import { useTutorialStore } from "../engine-store";
import { TUTORIAL_INCLUIR_PENDENCIAS } from "../fixtures";
import type { SceneProps } from "./index";

// How far below the top of the scroll viewport a highlighted section lands —
// upper third, leaving room for the tooltip above or below it. Same value the
// task-detail scene uses.
const REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.22);

// Fixed height of the map inside the EXPANDED detail block. Kept short (150px,
// down from 240) so the map plus the three text rows below it (data/hora,
// precisão, endereço) fit together on screen without the footer text hiding
// behind the bottom tooltip in the detail step.
const DETAIL_MAP_HEIGHT = 150;

// The expanded "detalhes do registro" block (map + footer text) is scrolled so
// its TOP lands just below the chrome. With the now-short 150px map the whole
// block (≈ map + 3 text rows) clears the upper area of the viewport, leaving
// the lower portion free for the bottom-pinned tooltip — so data/hora,
// precisão and endereço all stay readable above the tooltip.
const DETAIL_REVEAL_GAP = Math.round(Dimensions.get("window").height * 0.08);

// Fixed map height on the capture PAGE. Capped at ~32% of the viewport (and no
// more than 240px) — shorter than before now that the action bar is a STICKY
// FOOTER outside the scroll. Keeping the map short means the body below it
// (data/hora, precisão, endereço, status) lands in the upper-middle of the
// scroll viewport, clearly ABOVE the bottom-pinned tooltip in the
// "Precisão e endereço" step, while the map still dominates the card.
const CAPTURE_MAP_HEIGHT = Math.min(240, Math.round(Dimensions.get("window").height * 0.32));

// Spotlight targets nested inside a scrollable section map to that section so
// we can still scroll them into view (their own onLayout y is relative to an
// inner row, not the scroll content). The first row lives inside the list card.
const PARENT_SECTION: Record<string, string> = {
  pessoalPontosIncluirFirstRow: "pessoalPontosIncluirListCard",
};

// The expanded-detail slot is nested two levels deep (ScrollView → list card →
// row wrapper → detail). Its own onLayout.y is relative to the row wrapper, so
// to get a scroll-content-relative offset we SUM the three recorded offsets:
//   listCard (rel. scroll content) + rowWrapper (rel. card) + detail (rel. row).
// This is exact regardless of header/row pixel heights.
const COMPOSED_OFFSET: Record<string, string[]> = {
  pessoalPontosIncluirDetail: [
    "pessoalPontosIncluirListCard",
    "pessoalPontosIncluirFirstRowWrap",
    "pessoalPontosIncluirDetail",
  ],
  // On the capture PAGE the body (data/hora, precisão, endereço) sits below the
  // map, so to scroll the address into view we sum the card's offset (rel.
  // scroll content) + the body's offset (rel. card). With the action bar moved
  // OUT to a sticky footer, scrolling this offset up by REVEAL_GAP lands the
  // body in the upper-middle, clearly above the bottom-pinned tooltip.
  pessoalPontosIncluirCaptureBody: [
    "pessoalPontosIncluirCaptureCard",
    "pessoalPontosIncluirCaptureBody",
  ],
};

// Status meta — matches incluir-ponto/index.tsx STATUS_STYLE
const STATUS_META: Record<
  string,
  { bg: string; fg: string; Icon: any }
> = {
  PROCESSING: { bg: "#ea580c", fg: "#ffffff", Icon: IconHourglass }, // orange-600
  ACCEPTED: { bg: "#16a34a", fg: "#ffffff", Icon: IconThumbUp }, // green-600
  REJECTED: { bg: "#dc2626", fg: "#ffffff", Icon: IconThumbDown }, // red-600
};

// The fresh inclusion the capture flow produces. Hardcoded here (fixtures are
// off-limits) so step 4 can surface a brand-new "Processando" row at the top
// of "Últimos Registros" once the capture is submitted.
const TUTORIAL_INCLUIR_FRESH = {
  id: "ip-fresh",
  dateTime: "24/05 - 09:41",
  status: "PROCESSING" as const,
  statusLabel: "Processando",
  accuracy: 6,
  address: "Av. Ankaa, 1000 - Ibiporã, PR",
  hasComprovante: false,
};

/**
 * Static map mock. The real screen renders a Leaflet WebView (OSM.de "German
 * Style" tiles + a blue location pulse and a translucent accuracy circle); we
 * can't run a WebView inside the tutorial stage, so this fakes that look with
 * plain Views: a light map-toned wash, a few thin rotated "streets", a centered
 * pin and a translucent accuracy ring. Shared by the capture card and the
 * expanded-row detail so both read clearly as a MAP, not a blank box.
 */
function MapMock({ height }: { height?: number }) {
  return (
    // `height` undefined → fill the parent (the capture page's flex map area);
    // a number → fixed height (the expanded-row detail preview).
    <View style={[styles.mapMock, height == null ? StyleSheet.absoluteFill : { height }]}>
      {/* Land-use blocks — faint tan/green patches like a real basemap. */}
      <View style={[styles.mapBlock, { top: 18, left: -10, width: 120, height: 70, backgroundColor: "#e6ead9" }]} />
      <View style={[styles.mapBlock, { bottom: 14, right: -16, width: 140, height: 80, backgroundColor: "#e3ebe1" }]} />
      <View style={[styles.mapBlock, { top: 90, right: 24, width: 70, height: 56, backgroundColor: "#dde6ea" }]} />

      {/* Water sliver across a corner. */}
      <View style={[styles.mapWater, { transform: [{ rotate: "-24deg" }] }]} />

      {/* Streets — thin rotated bars in casing + fill tones. */}
      <View style={[styles.street, { top: 60, left: -30, width: 320, transform: [{ rotate: "8deg" }] }]} />
      <View style={[styles.street, { top: 150, left: -30, width: 320, transform: [{ rotate: "-6deg" }] }]} />
      <View style={[styles.streetThin, { top: 30, left: 110, width: 240, transform: [{ rotate: "78deg" }] }]} />
      <View style={[styles.streetThin, { top: 40, left: 210, width: 200, transform: [{ rotate: "62deg" }] }]} />
      {/* One amber "highway" for the OSM.de look. */}
      <View style={[styles.streetHighway, { top: 108, left: -40, width: 340, transform: [{ rotate: "16deg" }] }]} />

      {/* Translucent accuracy circle + centered location pin. */}
      <View style={styles.mapAccuracyRing} />
      <View style={styles.mapMarker}>
        <View style={styles.mapMarkerInner} />
      </View>
    </View>
  );
}

export function IncluirPontoScene({ state }: SceneProps) {
  const { colors } = useTheme();
  const slot = useSlotContext();
  const insets = useSafeAreaInsets();
  const expandedRow = state.incluirPontoExpandedRow ?? null;
  const captureFlow = state.incluirPontoCaptureFlow ?? "idle";
  const isCapturing = captureFlow === "capturing";
  // "ready" = GPS locked, precisão/endereço resolved, the "Incluir Ponto"
  // submit button is ACTIVE and tappable (the user must tap it to send the
  // batida). "submitting" = the user tapped Incluir Ponto and it's now
  // "Enviando…". We split these so the tutorial asks the user to ACT instead
  // of passively showing "Enviando…".
  const isReady = captureFlow === "ready";
  const isSubmitting = captureFlow === "submitting";
  // GPS already has a fix in both the ready and submitting states.
  const hasFix = isReady || isSubmitting;
  // While the capture flow is active we render a DEDICATED full-screen capture
  // PAGE (the list page is hidden) — mirroring the real navigation push from
  // the list to capture.tsx. This makes "Nova Inclusão" read as going to a
  // separate screen rather than expanding an inline card on the list page.
  const captureActive = isCapturing || isReady || isSubmitting;

  // ─── Scroll-into-view (same pattern as task-detail.tsx) ──────────────────
  // The expanded-row detail (map + endereço) sits low on the page, so when its
  // step becomes active we scroll it into evidence. Content-relative y of each
  // tracked section is captured from its onLayout; a programmatic scroll does
  // NOT re-fire children onLayout, so onScroll remeasures every frame and a
  // settle timer covers the final resting position.
  const scrollRef = useRef<ScrollView | null>(null);
  const offsets = useRef<Record<string, number>>({});
  const activeSlot = useTutorialStore((s) => s.activeSlot);

  const track = useCallback(
    (name: string) => (e: LayoutChangeEvent) => {
      offsets.current[name] = e.nativeEvent.layout.y;
      slot.register(name)(e);
    },
    [slot],
  );

  // The first row's wrapper feeds the row spotlight slot AND records its own
  // y-within-the-card under a separate key used by the composed detail offset.
  const trackFirstRowWrap = useCallback(
    (e: LayoutChangeEvent) => {
      offsets.current.pessoalPontosIncluirFirstRowWrap = e.nativeEvent.layout.y;
      slot.register("pessoalPontosIncluirFirstRow")(e);
    },
    [slot],
  );

  // Combined ref: keep our own scrollRef (for programmatic scrollTo) AND feed
  // the ScrollView node into the slot registry so the full-page "overview"
  // highlight (pessoalPontosIncluirPage) can still be measured.
  const pageRef = slot.registerRef("pessoalPontosIncluirPage");
  const setScrollNode = useCallback(
    (node: ScrollView | null) => {
      scrollRef.current = node;
      pageRef(node as any);
    },
    [pageRef],
  );

  useEffect(() => {
    if (!activeSlot) return;
    // Resolve the scroll-content-relative y of the active slot.
    //   - Composed slots (the expanded detail) sum their nested offsets so the
    //     map below the row is brought fully into evidence.
    //   - The first row's own onLayout.y is relative to the list card's inner
    //     content, so it maps to the containing list card instead.
    let y: number | undefined;
    const parts = COMPOSED_OFFSET[activeSlot];
    if (parts) {
      const summed = parts.reduce<number | null>((acc, name) => {
        if (acc == null) return null;
        const v = offsets.current[name];
        return v == null ? null : acc + v;
      }, 0);
      y = summed ?? undefined;
    } else {
      const sectionSlot = PARENT_SECTION[activeSlot] ?? activeSlot;
      y = offsets.current[sectionSlot];
    }
    if (y == null) return; // slot lives outside this page (e.g. header back, capture card)
    // The detail step needs the map low on the page to clear the chrome; every
    // other section uses the standard upper-third gap.
    const gap = activeSlot === "pessoalPontosIncluirDetail" ? DETAIL_REVEAL_GAP : REVEAL_GAP;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - gap), animated: true });
    const id = setTimeout(() => slot.remeasureAll(), 380);
    return () => clearTimeout(id);
  }, [activeSlot, slot]);

  // ─── Dedicated capture PAGE ──────────────────────────────────────────────
  // Full-screen, list hidden. Mirrors capture.tsx: a large map filling the top
  // of the card (which itself fills the screen), a recenter button, then the
  // body with timestamp / precisão / endereço, and a capturing/"Enviando…"
  // status line. Reads clearly as a distinct page the user navigated to.
  if (captureActive) {
    return (
      // Root flex container — mirrors capture.tsx, which renders its
      // <FormActionBar> as a sibling OUTSIDE the scrollable card area. The map
      // + body live in the ScrollView (flex:1); the Cancelar / Incluir Ponto
      // bar is a STICKY FOOTER after it (same shape as ajustar-ponto.tsx /
      // justificar-form.tsx) so it reliably sits above the iPhone home
      // indicator via marginBottom: insets.bottom + 16.
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Scrollable so the full GPS card (map + body) is always reachable on
            short viewports — nothing gets clipped. The card no longer flexes to
            fill; the map is a FIXED, short height so the body below it
            (timestamp / precisão / endereço / status) is guaranteed to fit and
            scrolls clearly into view above the bottom-pinned tooltip. The action
            bar is NO LONGER a child here — it's the footer sibling below. */}
        <ScrollView
          ref={setScrollNode}
          onScroll={() => slot.remeasureAll()}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={styles.captureContainer}
        >
          <View
            ref={slot.registerRef("pessoalPontosIncluirCaptureCard") as any}
            onLayout={track("pessoalPontosIncluirCaptureCard")}
            style={[styles.captureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {/* Fixed-height map (like the real GPS card's map area), so the body
                below always has room and is never pushed off screen. */}
            <View style={[styles.captureMapWrap, { backgroundColor: colors.muted }]}>
              <MapMock height={CAPTURE_MAP_HEIGHT} />
              <View style={[styles.recenter, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <IconCrosshair size={20} color={colors.foreground} />
              </View>
            </View>

            <View
              ref={slot.registerRef("pessoalPontosIncluirCaptureBody") as any}
              onLayout={track("pessoalPontosIncluirCaptureBody")}
              style={styles.captureBody}
            >
              <Text style={[styles.captureDateTime, { color: colors.foreground }]}>
                24/05/2026 - 09:41:07
              </Text>
              <Text style={[styles.capturePrecisao, { color: colors.mutedForeground }]}>
                {hasFix ? "6,00 metros" : "—"}
              </Text>
              <Text style={[styles.captureEndereco, { color: colors.mutedForeground }]}>
                {hasFix ? "Av. Ankaa, 1000 - Ibiporã, PR" : "Buscando endereço…"}
              </Text>

              {/* Status line only while the app is actively working: reading the
                  GPS, or sending the batida. In the READY state there's no
                  spinner — the GPS is locked and the app waits for the user to
                  tap "Incluir Ponto". */}
              {isReady ? (
                <Text style={[styles.captureReadyText, { color: colors.mutedForeground }]}>
                  Localização confirmada. Toque em Incluir Ponto para enviar.
                </Text>
              ) : (
                <View style={styles.captureStatusRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.captureStatusText, { color: colors.foreground }]}>
                    {isCapturing ? "Capturando localização…" : "Enviando…"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Sticky FormActionBar footer — Cancelar + the primary action, OUTSIDE
            the ScrollView so it reliably stays above the device safe area
            (marginBottom: insets.bottom + 16), exactly like ajustar-ponto.tsx /
            justificar-form.tsx and the real capture.tsx <FormActionBar>. In the
            READY state the primary action is the ACTIVE "Incluir Ponto" button
            the user must tap (still registered as the pessoalPontosIncluirSubmit
            spotlight slot so the interactive step highlights it). While
            capturing it's dimmed; while submitting it reads "Enviando…". */}
        <View
          style={[
            styles.captureActionBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.captureCancelBtn, { borderColor: colors.border }]}>
            <Text style={[styles.captureCancelText, { color: colors.foreground }]}>Cancelar</Text>
          </View>
          <View
            ref={slot.registerRef("pessoalPontosIncluirSubmit") as any}
            onLayout={slot.register("pessoalPontosIncluirSubmit")}
            style={[
              styles.captureSubmitBtn,
              { backgroundColor: colors.primary },
              // Dim the button until the GPS fix is ready — it only becomes
              // tappable in the "ready" state.
              isCapturing && styles.captureSubmitBtnDisabled,
            ]}
          >
            {isSubmitting ? (
              <View style={styles.captureSubmitRow}>
                <ActivityIndicator size="small" color={colors.primaryForeground} />
                <Text style={[styles.captureSubmitText, { color: colors.primaryForeground }]}>
                  Enviando…
                </Text>
              </View>
            ) : (
              <Text style={[styles.captureSubmitText, { color: colors.primaryForeground }]}>
                Incluir Ponto
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ─── List PAGE ───────────────────────────────────────────────────────────
  // Once the capture has been submitted (we're back on the list after the
  // dedicated capture page returned), the fresh "Processando" inclusion is
  // prepended to the list — exactly what the real screen shows when the user
  // lands back on it after a successful submit. The capture page sets this flag
  // before returning; the initial (pre-capture) overview leaves it unset.
  const submitted = state.incluirPontoSubmitted === true;
  const listData = submitted
    ? [TUTORIAL_INCLUIR_FRESH, ...TUTORIAL_INCLUIR_PENDENCIAS]
    : TUTORIAL_INCLUIR_PENDENCIAS;

  return (
    <ScrollView
      ref={setScrollNode}
      onLayout={slot.register("pessoalPontosIncluirPage")}
      onScroll={() => slot.remeasureAll()}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 100 }}
    >
      {/* Primary CTA — full-width, paddingVertical 16, borderRadius 12 */}
      <Pressable
        ref={slot.registerRef("pessoalPontosIncluirCta") as any}
        onLayout={slot.register("pessoalPontosIncluirCta")}
        style={[styles.cta, { backgroundColor: colors.primary }]}
      >
        <IconPlus size={20} color={colors.primaryForeground} />
        <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>Nova Inclusão</Text>
      </Pressable>

      {/* List card */}
      <View
        ref={slot.registerRef("pessoalPontosIncluirListCard") as any}
        onLayout={track("pessoalPontosIncluirListCard")}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Últimos Registros</Text>
        </View>

        {listData.map((p, idx) => {
          const meta = STATUS_META[p.status] ?? STATUS_META.PROCESSING;
          const isLast = idx === listData.length - 1;
          const isExpanded = expandedRow === idx;
          const canShowDocCol = p.status === "ACCEPTED" && p.hasComprovante;
          const rejectionReason = (p as { rejectionReason?: string }).rejectionReason;
          return (
            <View
              key={p.id}
              ref={idx === 0 ? (slot.registerRef("pessoalPontosIncluirFirstRow") as any) : undefined}
              // The first row's wrapper carries two trackers: the spotlight slot
              // (pessoalPontosIncluirFirstRow) AND its offset within the list card
              // (pessoalPontosIncluirFirstRowWrap), which the composed detail
              // offset sums to scroll the expanded map fully into view.
              onLayout={idx === 0 ? trackFirstRowWrap : undefined}
            >
              <View
                style={[
                  styles.row,
                  !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                {/* Always reserve the doc column so every row's date lines up;
                    the file icon only appears on accepted rows with a comprovante. */}
                <View style={styles.rowIconCol}>
                  {canShowDocCol && (
                    <IconFileText size={20} color={colors.foreground} />
                  )}
                </View>
                <View style={styles.rowMidCol}>
                  <View style={styles.rowMidLine}>
                    <IconMapPin size={16} color={colors.foreground} />
                    <Text style={[styles.rowDate, { color: colors.foreground }]}>
                      {p.dateTime}
                    </Text>
                  </View>
                </View>
                {/* Filled pill — solid bg + white text, radius 999 to match the real
                    incluir-ponto pills (the only place in the app that uses pill-
                    shaped status badges, intentionally diverging from the standard
                    rectangular pill so the icon-and-text composition reads better). */}
                <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[styles.statusText, { color: meta.fg }]} numberOfLines={1}>
                    {p.statusLabel}
                  </Text>
                  {/* Processando shows a spinner (matches the real polling pill);
                      Aceita/Rejeitada show their thumb icon. */}
                  {p.status === "PROCESSING" ? (
                    <View style={styles.spinnerBox}>
                      <ActivityIndicator size="small" color={meta.fg} />
                    </View>
                  ) : (
                    <meta.Icon size={14} color={meta.fg} />
                  )}
                </View>
              </View>

              {isExpanded && (
                <View
                  // Register the expanded detail itself as a spotlight slot so the
                  // detail STEP can highlight the whole map+footer block (not the
                  // collapsed row). Only the first row's detail needs this — it's
                  // the one the guided flow expands and spotlights.
                  ref={idx === 0 ? (slot.registerRef("pessoalPontosIncluirDetail") as any) : undefined}
                  onLayout={idx === 0 ? track("pessoalPontosIncluirDetail") : undefined}
                  style={[
                    styles.expanded,
                    { backgroundColor: colors.background, borderTopColor: colors.border },
                  ]}
                >
                  {/* Mini map preview — static mock of the leaflet WebView.
                      Kept SHORT (150px, not 240) so the map plus the three
                      text rows below it (data/hora, precisão, endereço) all fit
                      on screen above the bottom tooltip in the detail step. */}
                  <View style={[styles.miniMapWrap, { borderBottomColor: colors.border }]}>
                    <MapMock height={DETAIL_MAP_HEIGHT} />
                  </View>

                  <View style={[styles.expandedFooter, { backgroundColor: colors.card }]}>
                    <Text style={[styles.expandedTime, { color: colors.foreground }]}>
                      {p.dateTime}
                    </Text>
                    <Text style={[styles.expandedDistance, { color: colors.mutedForeground }]}>
                      {p.accuracy.toFixed(2)} metros
                    </Text>
                    <Text
                      style={[styles.expandedAddr, { color: colors.mutedForeground }]}
                      numberOfLines={2}
                    >
                      {p.address}
                    </Text>
                    {/* Real screen order: foraDoPerimetro warning, then the
                        rejection-reason box. */}
                    {p.status === "REJECTED" && (
                      <View style={styles.warnRow}>
                        <IconAlertTriangle size={14} color="#b45309" />
                        <Text style={[styles.warnText, { color: "#b45309" }]}>
                          Fora do perímetro permitido pela empresa.
                        </Text>
                      </View>
                    )}
                    {p.status === "REJECTED" && rejectionReason && (
                      <View style={styles.rejectBox}>
                        <Text style={styles.rejectLabel}>Motivo da rejeição</Text>
                        <Text style={[styles.rejectText, { color: colors.foreground }]}>
                          {rejectionReason}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  // ─── Capture PAGE (capturing / submitting) ───────────────────────────────
  // ScrollView content container: 16px padding all round (mirrors capture.tsx
  // contentWrap) and grows with the card so it's scrollable when taller than
  // the viewport. NOT flex:1 — that would clamp the content to the viewport
  // height and clip the body below a tall map. The action bar is no longer a
  // child (it's the sticky footer sibling), but we keep generous bottom padding
  // so the body can scroll fully clear of that footer in the precisão step.
  captureContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  // The GPS card sizes to its content (fixed-height map + body) so nothing is
  // cut off; the map dominates without forcing the body offscreen. The action
  // bar lives OUTSIDE the card now (sticky footer).
  captureCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  captureMapWrap: {
    position: "relative",
  },
  recenter: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  captureBody: { padding: 16, gap: 6, alignItems: "center" },
  captureDateTime: { fontSize: 18, fontWeight: "600" },
  capturePrecisao: { fontSize: 15 },
  captureEndereco: { fontSize: 13, textAlign: "center" },
  captureStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  captureStatusText: { fontSize: 14, fontWeight: "500" },
  // Ready-state helper line — no spinner, just a prompt to act.
  captureReadyText: { fontSize: 13, textAlign: "center", marginTop: 6 },
  // Faked FormActionBar — sticky footer OUTSIDE the ScrollView (sibling), so the
  // inset marginBottom reliably keeps it above the device safe area. Mirrors the
  // card-wrapped FormActionBar replica in ajustar-ponto.tsx / justificar-form.tsx:
  // a bordered, rounded card (radius 12, border 1, marginH 16, padding 16, gap
  // 12). marginBottom is applied inline as insets.bottom + 16.
  captureActionBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  captureCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  captureCancelText: { fontSize: 15, fontWeight: "600" },
  captureSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  captureSubmitBtnDisabled: { opacity: 0.5 },
  captureSubmitRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  captureSubmitText: { fontSize: 15, fontWeight: "600" },
  // Row — paddingV 14, paddingH 16, gap 10
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  rowIconCol: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rowMidCol: { flex: 1 },
  rowMidLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowDate: { fontSize: 15, fontWeight: "500" },
  // Filled pill (rounded 999, label+icon)
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 200,
  },
  statusText: { fontSize: 12, fontWeight: "600", flexShrink: 1 },
  // Clip the spinner to a fixed 14x14 box so the Processando pill is the same
  // height as the icon-based Aceita/Rejeitada pills (matches the real screen).
  spinnerBox: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scale: 0.7 }],
  },
  // Expanded panel — short (150px) map + footer text rows
  expanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  miniMapWrap: {
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // ─── Static map mock (shared by capture card + expanded detail) ──────────
  mapMock: {
    width: "100%",
    backgroundColor: "#eef2f4", // OSM.de land wash
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  mapBlock: {
    position: "absolute",
    borderRadius: 6,
    opacity: 0.9,
  },
  mapWater: {
    position: "absolute",
    top: -40,
    right: -60,
    width: 200,
    height: 90,
    backgroundColor: "#cfe1ec",
    borderRadius: 10,
  },
  street: {
    position: "absolute",
    height: 9,
    backgroundColor: "#ffffff",
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d8dee2",
  },
  streetThin: {
    position: "absolute",
    height: 5,
    backgroundColor: "#ffffff",
    borderRadius: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dde2e6",
  },
  streetHighway: {
    position: "absolute",
    height: 7,
    backgroundColor: "#f4c77b", // OSM.de amber arterial
    borderRadius: 2,
  },
  mapAccuracyRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.45)",
  },
  mapMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(59,130,246,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapMarkerInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#fff",
  },
  expandedFooter: {
    padding: 16,
    gap: 4,
    alignItems: "center",
  },
  expandedTime: { fontSize: 18, fontWeight: "600" },
  expandedDistance: { fontSize: 15 },
  expandedAddr: { fontSize: 13, textAlign: "center" },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  warnText: { fontSize: 12, fontWeight: "500", flex: 1 },
  rejectBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    alignSelf: "stretch",
  },
  rejectLabel: { fontSize: 12, fontWeight: "600", color: "#b91c1c" },
  rejectText: { fontSize: 13, marginTop: 4 },
});
