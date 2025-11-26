// Platform-agnostic PDF viewer wrapper
// Re-exports from platform-specific files
// Metro bundler should use .native.tsx for React Native and .web.tsx for Web
// but this base file is needed for non-platform-specific imports

export { PDFViewerWrapper, default } from './pdf-viewer-wrapper.native';
