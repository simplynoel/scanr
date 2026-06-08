import { StyleSheet, Dimensions, Platform } from 'react-native';

export const COLOR_PRESETS = [
  '#56B4E9', '#38BDF8', '#0EA5E9', '#818CF8', 
  '#2DD4BF', '#F472B6', '#CBD5E1', '#64748B'
];

export const ACCENT = '#0ff7ff';
export const BG = '#0D0D0D';
export const SURFACE = '#1A1A1A';
export const SURFACE2 = '#222';
export const BORDER = '#2A2A2A';
export const TEXT_PRIMARY = '#F0EDE8';
export const TEXT_MUTED = '#666';
export const ERROR_COLOR = '#FF3B30';
export const DARK_GREY = '#191919';

export function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  content: { flex: 1 },

  tabBar: { flexDirection: 'row', backgroundColor: SURFACE, borderTopWidth: 1, borderTopColor: BORDER, paddingBottom: Platform.OS === 'ios' ? 16 : 10, paddingTop: 10 },
  tabBarItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tabBarIconImage: { width: 20, height: 20, resizeMode: 'contain', tintColor: TEXT_MUTED },
  tabBarIconImageActive: { tintColor: ACCENT },
  tabBarLabel: { fontSize: 11, color: TEXT_MUTED, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  tabBarLabelActive: { color: ACCENT },
  tabBarIndicator: { position: 'absolute', top: -10, width: 32, height: 2, backgroundColor: ACCENT, borderRadius: 1 },

  tabContainer: { flex: 1, backgroundColor: BG },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: BG },
  loadingText: { color: TEXT_MUTED, fontSize: 14, letterSpacing: 0.5 },
  messageText: { color: TEXT_PRIMARY, textAlign: 'center', marginBottom: 24, fontSize: 15, lineHeight: 22 },

  inlineHistoryBar: { width: '100%', backgroundColor: SURFACE, borderColor: BORDER, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inlineHistoryInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineHistoryIcon: { fontSize: 38, color: ACCENT, marginTop: -8 },
  inlineHistoryText: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  inlineHistoryArrow: { color: TEXT_MUTED, fontSize: 11 },
  linkBadge: { backgroundColor: SURFACE2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: BORDER, alignSelf: 'flex-start' },
  linkBadgeText: { color: ACCENT, fontSize: 11, fontWeight: '700' },
  scanTabInlineContainer: { position: 'absolute', bottom: 24, left: 20, right: 20 },
  generateInlineButtonWrapper: { width: '100%', marginBottom: 16 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  modalSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_HEIGHT * 0.6, backgroundColor: SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: BORDER, paddingHorizontal: 20, paddingBottom: 16 },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 8 },
  modalTitle: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700' },
  modalCloseBtn: { backgroundColor: SURFACE2, borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  modalCloseBtnText: { color: TEXT_PRIMARY, fontSize: 14 },
  modalScroll: { flex: 1 },

  historyItemContainer: { flexDirection: 'row', alignItems: 'stretch', backgroundColor: BG, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  historyItem: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 13 },
  historyItemContent: { flex: 1 },
  historyItemData: { color: TEXT_PRIMARY, fontSize: 14, marginBottom: 4, paddingRight: 8 },
  historyItemTime: { color: TEXT_MUTED, fontSize: 11 },
  historyCopyButton: { width: 46, backgroundColor: SURFACE, justifyContent: 'center', alignItems: 'center', borderLeftWidth: 1, borderLeftColor: BORDER },
  actionIconImage: { width: 16, height: 16, resizeMode: 'contain', tintColor: TEXT_MUTED },
  emptyText: { color: TEXT_MUTED, fontSize: 14, textAlign: 'center', marginTop: 32 },

  // Generate section
  generateContent: { padding: 20, alignItems: 'center', paddingBottom: 120 },
  generateTitle: { color: TEXT_PRIMARY, fontSize: 24, fontWeight: '700', alignSelf: 'flex-start', marginBottom: 2 },
  generateSubtitle: { color: TEXT_MUTED, fontSize: 13, marginBottom: 24, alignSelf: 'flex-start' },
  focusedInputContainer: { width: '100%', backgroundColor: SURFACE, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  inputHeadingLabel: { color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 },
  input: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 8, color: TEXT_PRIMARY, fontSize: 15, padding: 14, width: '100%', minHeight: 90, textAlignVertical: 'top' },
  
  generateActionButton: { width: '100%', backgroundColor: ACCENT, paddingVertical: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  generateButtonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  generateButtonIconImage: { width: 18, height: 18, resizeMode: 'contain', tintColor: BG },
  generateActionButtonText: { color: BG, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },

  accordionContainer: { width: '100%', backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 4 },
  accordionContainerExpanded: { borderColor: BORDER },
  accordionHeaderButton: { width: '100%', padding: 16, backgroundColor: SURFACE },
  accordionHeaderButtonActive: { borderBottomWidth: 1, borderBottomColor: BORDER },
  accordionHeaderInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accordionTitleWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineLabelIconImage: { width: 18, height: 18, resizeMode: 'contain', tintColor: ACCENT },
  accordionTitleText: { color: TEXT_PRIMARY, fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  accordionArrowIcon: { color: TEXT_MUTED, fontSize: 12 },
  accordionArrowIconActive: { color: ACCENT },
  accordionSubhint: { color: TEXT_MUTED, fontSize: 11, marginTop: 4, marginLeft: 28 },

  optionsContainer: { width: '100%', padding: 16, backgroundColor: 'rgba(0,0,0,0.15)' },
  smallInput: { backgroundColor: BG, borderWidth: 1, borderColor: BORDER, borderRadius: 6, color: TEXT_PRIMARY, fontSize: 13, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  inlineOptions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  labelStyleHint: { color: TEXT_MUTED, fontSize: 11, marginBottom: 6, fontWeight: '500', letterSpacing: 0.3, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', marginTop: 12 },
  toggleBtn: { flex: 1, backgroundColor: SURFACE2, padding: 11, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  toggleBtnActive: { borderColor: ACCENT, backgroundColor: 'rgba(0,229,160,0.05)' },
  toggleBtnText: { color: TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  toggleBtnTextActive: { color: ACCENT },

  imagePickerRow: { flexDirection: 'row', width: '100%', marginBottom: 16, gap: 8 },
  pickerInlineBtn: { flex: 1, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 11, justifyContent: 'center' },
  pickerButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  pickerIconImage: { width: 16, height: 16, resizeMode: 'contain', tintColor: TEXT_PRIMARY },
  pickerInlineBtnText: { color: TEXT_PRIMARY, fontSize: 13, fontWeight: '600' },
  clearLogoBtn: { backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#cc3333', borderRadius: 6, paddingHorizontal: 14, justifyContent: 'center' },
  clearLogoBtnText: { color: '#ff5555', fontSize: 12, fontWeight: '600' },
  logoPreviewContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, padding: 8, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: BORDER, gap: 10 },
  logoPreviewImage: { width: 36, height: 36, borderRadius: 4, backgroundColor: '#fff' },

  colorPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, marginTop: 4 },
  colorBubble: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  colorBubbleActive: { borderColor: '#FFF', borderWidth: 3, transform: [{ scale: 1.1 }] },

  qrContainer: { alignItems: 'center', backgroundColor: '#F7F5F0', borderRadius: 16, padding: 20, width: '100%' },
  qrLabel: { marginTop: 12, textAlign: 'center', flexShrink: 0, alignSelf: 'center', paddingHorizontal: 8 },

  cameraPreview: { flex: 1, width: '100%', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },

  centerPopupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  popupCard: { width: '100%', maxWidth: 340, backgroundColor: SURFACE, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center', elevation: 20 },
  popupCardError: { borderColor: ERROR_COLOR },
  popupHeaderRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 10 },
  popupCardTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  popupCardTitleError: { color: ERROR_COLOR },
  popupCardSubtitle: { color: TEXT_MUTED, fontSize: 13, marginTop: 8 },
  permissionButtonsRow: { flexDirection: 'row', width: '100%', marginTop: 16, justifyContent: 'space-between', flexWrap: 'wrap' },
  permissionButton: { flex: 1, minWidth: 140, marginVertical: 6, marginHorizontal: 6 },
  popupCloseCircle: { backgroundColor: SURFACE2, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  popupCloseCircleText: { color: TEXT_MUTED, fontSize: 11, fontWeight: '700' },

  skeletonTargetContainer: { width: '100%', alignItems: 'center', paddingVertical: 32 },
  skeletonSquare: { width: 180, height: 180, backgroundColor: SURFACE2, borderRadius: 12, marginBottom: 20 },
  skeletonTextLine: { height: 12, backgroundColor: SURFACE2, borderRadius: 6, marginBottom: 10 },
  skeletonLoaderMessage: { color: ACCENT, fontSize: 13, fontWeight: '600', marginTop: 16, textAlign: 'center', paddingHorizontal: 10, lineHeight: 18 },
  completedProductContainer: { width: '100%', alignItems: 'center' },
  
  popupActionsGrid: { flexDirection: 'row', width: '100%', marginTop: 20, marginBottom: 12, gap: 10 },
  popupActionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionButtonInnerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionButtonIconImage: { width: 14, height: 14, resizeMode: 'contain', tintColor: '#FFFFFF' },
  popupActionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  downloadActionBtn: { backgroundColor: '#00e1ff' },
  shareActionBtn: { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER },
  
  popupDismissBtn: { width: '100%', paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: BORDER, marginTop: 4 },
  popupDismissBtnText: { color: TEXT_MUTED, fontSize: 13, fontWeight: '600' },
  errorProductContainer: { width: '100%', alignItems: 'center', paddingVertical: 10 },
  errorCenteredImage: { width: 100, height: 100, resizeMode: 'contain', marginBottom: 20 },
  errorHeadingText: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  errorSubheadingText: { color: TEXT_MUTED, fontSize: 13, textAlign: 'center', paddingHorizontal: 16, marginBottom: 24, lineHeight: 18 },
  errorRetryBtn: { width: '100%', backgroundColor: 'rgba(255, 59, 48, 0.1)', borderWidth: 1, borderColor: ERROR_COLOR, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  errorRetryBtnText: { color: ERROR_COLOR, fontWeight: '700', fontSize: 13 },
  appLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DARK_GREY },
  loadingScreenBackground: { backgroundColor: DARK_GREY },
  creditText: { color: TEXT_MUTED, fontSize: 12, marginTop: 10, textAlign: 'center', letterSpacing: 0.5, paddingBottom: 10 },
});

export default styles;