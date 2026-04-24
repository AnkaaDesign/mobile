import React from "react";
import { View, Image, StyleSheet } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Text as SvgText, Polygon } from "react-native-svg";
import type { DecoratorBlock } from "./types";

// Aspect ratios from original image dimensions
const ASPECTS = {
  'header-logo': 2481 / 458,
  'header-logo-stripes': 2481 / 252,
  'footer-wave-dark': 2488 / 412,
  'footer-wave-logo': 2480 / 502,
  'footer-diagonal-stripes': 2481 / 252,
  'footer-wave-gold': 2481 / 550,
  'footer-geometric': 2480 / 545,
};

function DecoratorImage({ variant }: { variant: keyof typeof ASPECTS }) {
  const sources: Record<string, ReturnType<typeof require>> = {
    'header-logo': require("../../../../assets/header-logo.webp"),
    'header-logo-stripes': require("../../../../assets/header-logo-stripes.webp"),
    'footer-wave-dark': require("../../../../assets/footer-wave-dark.webp"),
    'footer-wave-logo': require("../../../../assets/footer-wave-logo.webp"),
    'footer-diagonal-stripes': require("../../../../assets/footer-diagonal-stripes.webp"),
    'footer-wave-gold': require("../../../../assets/footer-wave-gold.webp"),
    'footer-geometric': require("../../../../assets/footer-geometric.webp"),
  };
  return (
    <View style={[styles.imageContainer, { aspectRatio: ASPECTS[variant] }]}>
      <Image
        source={sources[variant]}
        style={styles.fullWidthImage}
        resizeMode="cover"
      />
    </View>
  );
}

interface DecoratorBlockComponentProps {
  block: DecoratorBlock;
}

// ─── Header: Wave Green ───────────────────────────────────────────────────────
function HeaderWaveGreen() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#1e1e2e" />
        <Path d="M0 52 Q100 46 200 52 Q300 58 400 52 L400 58 Q300 64 200 58 Q100 52 0 58 Z" fill="#c8a84b" />
        <Path d="M0 60 Q100 50 200 60 Q300 70 400 60 L400 80 L0 80 Z" fill="#3bc914" />
      </Svg>
    </View>
  );
}

// ─── Header: Diagonal ─────────────────────────────────────────────────────────
function HeaderDiagonal() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#1e1e2e" />
        <Polygon points="0,0 180,0 120,80 0,80" fill="#3bc914" opacity="0.85" />
        <Polygon points="0,0 80,0 20,80 0,80" fill="#c8a84b" opacity="0.6" />
      </Svg>
    </View>
  );
}

// ─── Header: Stripe ───────────────────────────────────────────────────────────
function HeaderStripe() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#1e1e2e" />
        <Rect y="0" width="400" height="8" fill="#3bc914" />
        <Rect y="12" width="400" height="3" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Header: Corner Accent ────────────────────────────────────────────────────
function HeaderCornerAccent() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#f8f8f8" />
        <Polygon points="0,0 60,0 0,60" fill="#3bc914" />
        <Polygon points="400,0 340,0 400,60" fill="#c8a84b" />
        <Rect y="74" width="400" height="6" fill="#1e1e2e" />
      </Svg>
    </View>
  );
}

// ─── Header: Chevron ──────────────────────────────────────────────────────────
function HeaderChevron() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#1e1e2e" />
        <Polygon points="0,80 200,50 400,80" fill="#3bc914" />
        <Polygon points="0,80 200,60 400,80 400,75 200,65 0,75" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Header: Gradient ─────────────────────────────────────────────────────────
function HeaderGradient() {
  return (
    <View style={styles.headerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#3bc914" stopOpacity="1" />
            <Stop offset="1" stopColor="#1d6b09" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="80" fill="url(#headerGrad)" />
        <Rect y="70" width="400" height="10" fill="#c8a84b" opacity="0.5" />
      </Svg>
    </View>
  );
}

// ─── Footer: Wave Ankaa ───────────────────────────────────────────────────────
function FooterWaveAnkaa() {
  return (
    <View style={styles.footerContainer}>
      <Svg width="100%" height="160" viewBox="0 0 400 160" preserveAspectRatio="none">
        <Rect width="400" height="160" fill="#ffffff" />
        <Path d="M-20 100 Q100 88 200 100 Q300 112 420 100 L420 160 L-20 160 Z" fill="#1e1e2e" />
        <Path d="M-20 97 Q100 85 200 97 Q300 109 420 97 L420 103 Q300 115 200 103 Q100 91 -20 103 Z" fill="#c8a84b" />
        <Path d="M-20 104 Q100 92 200 104 Q300 116 420 104 L420 118 Q300 130 200 118 Q100 106 -20 118 Z" fill="#3bc914" />
        <SvgText x="390" y="148" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="end" letterSpacing="3">ANKAA</SvgText>
        <SvgText x="390" y="158" fill="#3bc914" fontSize="9" fontStyle="italic" textAnchor="end">design</SvgText>
        <SvgText x="10" y="155" fill="#6b7a8d" fontSize="7">Material protegido. Reprodução proibida.</SvgText>
      </Svg>
    </View>
  );
}

// ─── Footer: Wave Simple ──────────────────────────────────────────────────────
function FooterWaveSimple() {
  return (
    <View style={styles.footerContainer}>
      <Svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
        <Rect width="400" height="80" fill="#ffffff" />
        <Path d="M-20 40 Q100 28 200 40 Q300 52 420 40 L420 80 L-20 80 Z" fill="#1e1e2e" />
        <Path d="M-20 60 Q100 48 200 60 Q300 72 420 60 L420 66 Q300 78 200 66 Q100 54 -20 66 Z" fill="#3bc914" opacity="0.6" />
      </Svg>
    </View>
  );
}

// ─── Footer: Bar ──────────────────────────────────────────────────────────────
function FooterBar() {
  return (
    <View style={styles.footerContainer}>
      <Svg width="100%" height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
        <Rect width="400" height="40" fill="#f8f8f8" />
        <Rect y="30" width="400" height="6" fill="#3bc914" />
        <Rect y="36" width="400" height="4" fill="#1e1e2e" />
      </Svg>
    </View>
  );
}

// ─── Footer: Gradient ─────────────────────────────────────────────────────────
function FooterGradient() {
  return (
    <View style={styles.footerContainer}>
      <Svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="footerGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#1d6b09" stopOpacity="1" />
            <Stop offset="1" stopColor="#3bc914" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="60" fill="url(#footerGrad)" />
        <Rect y="0" width="400" height="4" fill="#c8a84b" opacity="0.7" />
      </Svg>
    </View>
  );
}

// ─── Side: Left Stripe ────────────────────────────────────────────────────────
function SideLeftStripe() {
  return (
    <View style={styles.sideContainer}>
      <Svg width="20" height="100%" viewBox="0 0 20 200" preserveAspectRatio="none">
        <Rect width="20" height="200" fill="#f0fdf4" />
        <Rect x="0" width="10" height="200" fill="#3bc914" />
        <Rect x="12" width="3" height="200" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Side: Right Stripe ───────────────────────────────────────────────────────
function SideRightStripe() {
  return (
    <View style={[styles.sideContainer, { alignItems: 'flex-end' }]}>
      <Svg width="20" height="100%" viewBox="0 0 20 200" preserveAspectRatio="none">
        <Rect width="20" height="200" fill="#f0fdf4" />
        <Rect x="10" width="10" height="200" fill="#3bc914" />
        <Rect x="5" width="3" height="200" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Side: Left Corner ────────────────────────────────────────────────────────
function SideLeftCorner() {
  return (
    <View style={styles.sideContainer}>
      <Svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
        <Rect width="400" height="120" fill="#f0fdf4" />
        <Polygon points="0,0 80,0 0,120" fill="#3bc914" />
        <Polygon points="0,0 20,0 0,30" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Side: Right Corner ───────────────────────────────────────────────────────
function SideRightCorner() {
  return (
    <View style={styles.sideContainer}>
      <Svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
        <Rect width="400" height="120" fill="#f0fdf4" />
        <Polygon points="400,0 320,0 400,120" fill="#3bc914" />
        <Polygon points="400,0 380,0 400,30" fill="#c8a84b" />
      </Svg>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DecoratorBlockComponent({ block }: DecoratorBlockComponentProps) {
  switch (block.variant) {
    case 'header-logo':
    case 'header-logo-stripes':
    case 'footer-wave-dark':
    case 'footer-wave-logo':
    case 'footer-diagonal-stripes':
    case 'footer-wave-gold':
    case 'footer-geometric':
      return <DecoratorImage variant={block.variant} />;
    case 'header-wave-green':
      return <HeaderWaveGreen />;
    case 'header-diagonal':
      return <HeaderDiagonal />;
    case 'header-stripe':
      return <HeaderStripe />;
    case 'header-corner-accent':
      return <HeaderCornerAccent />;
    case 'header-chevron':
      return <HeaderChevron />;
    case 'header-gradient':
      return <HeaderGradient />;
    case 'footer-wave-ankaa':
      return <FooterWaveAnkaa />;
    case 'footer-wave-simple':
      return <FooterWaveSimple />;
    case 'footer-bar':
      return <FooterBar />;
    case 'footer-gradient':
      return <FooterGradient />;
    case 'side-left-stripe':
      return <SideLeftStripe />;
    case 'side-right-stripe':
      return <SideRightStripe />;
    case 'side-left-corner':
      return <SideLeftCorner />;
    case 'side-right-corner':
      return <SideRightCorner />;
    default:
      return <View style={styles.fallbackDecorator} />;
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  footerContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  sideContainer: {
    width: '100%',
    minHeight: 80,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
  },
  fallbackDecorator: {
    width: '100%',
    height: 40,
    backgroundColor: '#0c884e',
  },
});
