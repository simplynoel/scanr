import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert, Linking, ToastAndroid, Modal, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, CameraView } from 'expo-camera';
import InlineHistoryBar from './InlineHistoryBar';
import HistoryModal from './HistoryModal';
import styles, { TEXT_MUTED } from '../styles';

// --- Production Disk Storage Keys ---
const SCANS_STORAGE_KEY = '@qr_reader_scans_v1';

// --- Local Sync Helpers ---
function isURL(str) {
  return typeof str === 'string' && /^(https?:)?\/\//i.test(str);
}

// ─── Cute Mascot Component ───────────────────────────────────────────────────
function CuteMascot({ state }) {
  return (
    <View style={localStyles.mascotContainer}>
      <View style={[localStyles.mascotBody, state === 'duplicate' && { backgroundColor: '#F59E0B' }]}>
        {/* Little antenna */}
        <View style={localStyles.mascotAntennaLine} />
        <View style={[localStyles.mascotAntennaTip, state === 'duplicate' && { backgroundColor: '#F59E0B' }]} />
        
        {/* Face Display Screen */}
        <View style={localStyles.mascotScreen}>
          {state === 'duplicate' ? (
            <View style={localStyles.faceRow}>
              <Text style={localStyles.mascotEyeText}>ಠ</Text>
              <Text style={localStyles.mascotEyeText}>ಠ</Text>
            </View>
          ) : (
            <View style={localStyles.faceRow}>
              <Text style={localStyles.mascotEyeText}>◕</Text>
              <Text style={localStyles.mascotEyeText}>◕</Text>
            </View>
          )}
          <Text style={localStyles.mascotMouthText}>
            {state === 'duplicate' ? '﹏' : '‿'}
          </Text>
        </View>

        {/* Cheeks */}
        <View style={localStyles.blushLeft} />
        <View style={localStyles.blushRight} />
      </View>
    </View>
  );
}

// ─── QR Scanner Component ─────────────────────────────────────────────────────

export default function QRScanner() {
  const [scanHistory, setScanHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(true);
  
  // Custom Result Modal Tracking Layouts
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [currentScanData, setCurrentScanData] = useState('');
  const [isDuplicateScan, setIsDuplicateScan] = useState(false);

  const cameraRef = useRef(null);
  const CameraComponent = CameraView || Camera;

  // Real Persistent Scan History Bootstrap Lifecycle
  useEffect(() => {
    const loadScanLogs = async () => {
      try {
        const rawJson = await AsyncStorage.getItem(SCANS_STORAGE_KEY);
        if (rawJson) {
          setScanHistory(JSON.parse(rawJson));
        }
      } catch (e) {
        console.error("Failed to fetch scan logs from persistence layer:", e);
      }
    };
    loadScanLogs();
  }, []);

  useEffect(() => {
    const ask = async () => {
      try {
        let res;
        if (CameraComponent && typeof CameraComponent.requestCameraPermissionsAsync === 'function') {
          res = await CameraComponent.requestCameraPermissionsAsync();
        } else if (Camera && typeof Camera.requestCameraPermissionsAsync === 'function') {
          res = await Camera.requestCameraPermissionsAsync();
        } else {
          res = { status: 'undetermined' };
        }
        setHasPermission((res && res.status === 'granted') || false);
      } catch (e) {
        setHasPermission(false);
      }
    };

    ask();
  }, [CameraComponent]);

  const requestPermission = async () => {
    try {
      setHasPermission(null);
      let res;
      if (CameraComponent && typeof CameraComponent.requestCameraPermissionsAsync === 'function') {
        res = await CameraComponent.requestCameraPermissionsAsync();
      } else if (Camera && typeof Camera.requestCameraPermissionsAsync === 'function') {
        res = await Camera.requestCameraPermissionsAsync();
      } else {
        res = { status: 'undetermined' };
      }
      setHasPermission((res && res.status === 'granted') || false);
    } catch (e) {
      setHasPermission(false);
    }
  };

  const handleItemPress = (item) => {
    setHistoryVisible(false);
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (!scanning) return;
    setScanning(false);

    // Look for matching data within existing history array logs
    const existingIndex = scanHistory.findIndex((item) => item.data === data);
    const isDuplicate = existingIndex !== -1;

    setIsDuplicateScan(isDuplicate);
    setCurrentScanData(data);

    let nextHistoryArray = [...scanHistory];

    if (isDuplicate) {
      // Hoists the matched entry directly to index 0 and bumps timestamp
      const [duplicateItem] = nextHistoryArray.splice(existingIndex, 1);
      const bumpedItem = {
        ...duplicateItem,
        scanned_at: new Date().toISOString(),
      };
      nextHistoryArray = [bumpedItem, ...nextHistoryArray];
    } else {
      const newItem = { id: Date.now().toString(), data, scanned_at: new Date().toISOString() };
      nextHistoryArray = [newItem, ...nextHistoryArray];
    }

    // Simultaneously commit alterations securely to device disk memory
    try {
      setScanHistory(nextHistoryArray);
      await AsyncStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(nextHistoryArray));
    } catch (e) {
      console.error("Storage failed:", e);
    }

    setResultModalVisible(true);
  };

  const closeResultAndResumeScan = () => {
    setResultModalVisible(false);
    setScanning(true);
  };

  const handleVisitDestinationLink = async () => {
    try {
      if (isURL(currentScanData)) {
        await Linking.openURL(currentScanData);
      }
    } catch (err) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Unable to follow URL path link', ToastAndroid.SHORT);
      }
    }
    closeResultAndResumeScan();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.tabContainer}>
        <View style={styles.centerContainer}><Text style={styles.loadingText}>Requesting camera permission...</Text></View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    const openSettings = async () => {
      try {
        await Linking.openSettings();
      } catch (e) {
        try { await Linking.openURL('app-settings:'); } catch (_) { /* noop */ }
      }
    };

    return (
      <SafeAreaView style={styles.tabContainer}>
        <View style={styles.centerContainer}>
          <View style={[styles.popupCard, { maxWidth: 420 }]}> 
            <Text style={styles.popupCardTitle}>Camera Permission Required</Text>
            <Text style={styles.popupCardSubtitle}>
              This app needs access to your camera to scan QR codes.
            </Text>
            <View style={styles.permissionButtonsRow}>
              <TouchableOpacity style={[styles.generateActionButton, styles.permissionButton]} onPress={requestPermission}>
                <Text style={styles.generateActionButtonText}>{hasPermission === null ? 'Requesting...' : 'Ask for Permission'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.generateActionButton, styles.permissionButton, { backgroundColor: '#333' }]} onPress={openSettings}>
                <Text style={styles.generateActionButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tabContainer}>
      <View style={{ flex: 1 }}>
        {CameraComponent ? (
          <View style={{ flex: 1, position: 'relative' }}>
            <CameraComponent
              ref={cameraRef}
              style={styles.cameraPreview}
              onBarCodeScanned={handleBarCodeScanned} 
              onBarcodeScanned={handleBarCodeScanned} 
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            
            {/* Viewfinder overlay framing */}
            <View style={StyleSheet.absoluteFillObject}>
              <View style={localStyles.overlayTopBottom} />
              <View style={localStyles.overlayMiddleRow}>
                <View style={localStyles.overlaySides} />
                <View style={localStyles.viewfinderSquare}>
                  <View style={[localStyles.cornerMarker, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[localStyles.cornerMarker, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                  <View style={[localStyles.cornerMarker, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                  <View style={[localStyles.cornerMarker, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
                  {scanning && <View style={localStyles.scanLinePlaceholder} />}
                </View>
                <View style={localStyles.overlaySides} />
              </View>
              <View style={localStyles.overlayTopBottom} />
            </View>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.messageText}>Camera component unavailable or incompatible — cannot show preview.</Text>
          </View>
        )}
      </View>

      <View style={styles.scanTabInlineContainer}>
        <InlineHistoryBar 
          count={scanHistory.length}
          label="Scanned Logs"
          onPress={() => setHistoryVisible(true)}
        />
      </View>

      {/* Custom Interactive Scan Response Modal Window */}
      <Modal transparent visible={resultModalVisible} animationType="slide" onRequestClose={closeResultAndResumeScan}>
        <View style={localStyles.modalCenteredOverlay}>
          <View style={localStyles.resultCardContainer}>
            
            <CuteMascot state={isDuplicateScan ? 'duplicate' : 'normal'} />

            <Text style={localStyles.modalStatusTitle}>
              {isDuplicateScan ? "Hey, That's a Duplicate!" : "Successful Scan!"}
            </Text>

            <Text style={localStyles.modalStatusSubtitle}>
              {isDuplicateScan 
                ? "This was found in your history, so we've just bumped it to the top without creating a new entry." 
                : "Matrix payload interpreted correctly."}
            </Text>

            <View style={localStyles.dataContentBox}>
              <Text numberOfLines={5} style={localStyles.dataContentText}>{currentScanData}</Text>
            </View>

            <View style={localStyles.modalActionRow}>
              <TouchableOpacity style={[localStyles.modalActionBtn, localStyles.secondaryBtn]} onPress={closeResultAndResumeScan}>
                <Text style={localStyles.secondaryBtnText}>Scan Again</Text>
              </TouchableOpacity>

              {isURL(currentScanData) && (
                <TouchableOpacity style={[localStyles.modalActionBtn, localStyles.primaryBtn]} onPress={handleVisitDestinationLink}>
                  <Text style={localStyles.primaryBtnText}>Visit Link</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        title="Scan History"
        items={scanHistory}
        emptyText="No scans yet. Point at a QR code!"
        onItemPress={handleItemPress}
        renderRight={(item) =>
          isURL(item.data) ? (
            <View style={styles.linkBadge}><Text style={styles.linkBadgeText}>LINK</Text></View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

// --- Dynamic Styling Extensions Sheet ---
const localStyles = StyleSheet.create({
  overlayTopBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySides: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewfinderSquare: {
    width: 250,
    height: 250,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#00FFCC',
  },
  scanLinePlaceholder: {
    height: 3,
    backgroundColor: '#00FFCC',
    position: 'absolute',
    left: 12,
    right: 12,
    top: '50%',
    shadowColor: '#00FFCC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  modalCenteredOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 11, 15, 0.85)',
    padding: 24,
  },
  resultCardContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E1E24',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33333C',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalStatusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  modalStatusSubtitle: {
    fontSize: 13,
    color: '#A0A0AB',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  dataContentBox: {
    width: '100%',
    backgroundColor: '#141419',
    borderRadius: 14,
    padding: 14,
    marginVertical: 18,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dataContentText: {
    fontSize: 14,
    color: '#00FFCC',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'gap',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#00FFCC',
  },
  primaryBtnText: {
    color: '#0F0F12',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: '#272732',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  secondaryBtnText: {
    color: '#E4E4E7',
    fontWeight: '600',
    fontSize: 14,
  },
  mascotContainer: {
    height: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    width: 100,
  },
  mascotBody: {
    width: 76,
    height: 64,
    backgroundColor: '#00FFCC',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotAntennaLine: {
    position: 'absolute',
    top: -12,
    width: 4,
    height: 14,
    backgroundColor: '#3F3F46',
  },
  mascotAntennaTip: {
    position: 'absolute',
    top: -19,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FFCC',
  },
  mascotScreen: {
    width: 58,
    height: 44,
    backgroundColor: '#141419',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceRow: {
    flexDirection: 'row',
    gap: 10,
    height: 16,
    alignItems: 'center',
  },
  mascotEyeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mascotMouthText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 12,
    marginTop: -2,
  },
  blushLeft: {
    position: 'absolute',
    left: 12,
    bottom: 14,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
  blushRight: {
    position: 'absolute',
    right: 12,
    bottom: 14,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
  },
});
