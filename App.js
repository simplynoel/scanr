import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync().catch(() => {});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Alert, Animated, ScrollView, TouchableOpacity, TextInput, Image, ToastAndroid, Modal, StatusBar, Linking, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to use react-native-safe-area-context when available; otherwise fall back.
let SafeAreaProvider = ({ children }) => children;
let RNSafeAreaView = SafeAreaView;
try {
  const sac = require('react-native-safe-area-context');
  if (sac) {
    SafeAreaProvider = sac.SafeAreaProvider || SafeAreaProvider;
    RNSafeAreaView = sac.SafeAreaView || SafeAreaView;
  }
} catch (e) {
  // package not installed — keep fallbacks
}

import ViewShot from 'react-native-view-shot';
import { Camera, CameraView } from 'expo-camera'; 
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import InlineHistoryBar from './components/InlineHistoryBar';
import HistoryModal from './components/HistoryModal';
import WeightSlider from './components/WeightSlider';
import styles, { COLOR_PRESETS, BG, TEXT_MUTED, SURFACE, BORDER, ACCENT, SURFACE2, TEXT_PRIMARY, ERROR_COLOR, DARK_GREY } from './styles';

// --- Production Disk Storage Keys ---
const SCANS_STORAGE_KEY = '@qr_reader_scans_v1';
const GENERATES_STORAGE_KEY = '@qr_reader_generates_v1';

// --- Local Sync Helpers ---
const _PHRASES = ['Crunching bits...', 'Synthesizing code...', 'Initializing quantum compilation...'];
function getRandomPhrase() { return _PHRASES[Math.floor(Math.random() * _PHRASES.length)]; }

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

// ─── Scan Tab ─────────────────────────────────────────────────────────────────

function ScanTab() {
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
      <RNSafeAreaView style={styles.tabContainer}>
        <View style={styles.centerContainer}><Text style={styles.loadingText}>Requesting camera permission...</Text></View>
      </RNSafeAreaView>
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
      <RNSafeAreaView style={styles.tabContainer}>
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
      </RNSafeAreaView>
    );
  }

  return (
    <RNSafeAreaView style={styles.tabContainer}>
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
    </RNSafeAreaView>
  );
}

// ─── Generate Tab ─────────────────────────────────────────────────────────────

function GenerateTab() {
  const [inputText, setInputText] = useState('');
  const [displayQR, setDisplayQR] = useState('');
  const [generateHistory, setGenerateHistory] = useState([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  const [optionsCollapsed, setOptionsCollapsed] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [generationError, setGenerationError] = useState(null);

  const [loadingPhrase, setLoadingPhrase] = useState('Initializing quantum compilation...');
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  // Formatting configurations states
  const [label, setLabel] = useState('');
  const [fontSize, setFontSize] = useState('14');
  const [fontWeightValue, setFontWeightValue] = useState(400);
  const [fontColor, setFontColor] = useState('#333333');
  const [fontStyle, setFontStyle] = useState('normal'); 
  const [logoUri, setLogoUri] = useState('');
  
  // ─── NEW FEATURE STATE: Dynamic Vector QR Foreground Color Picker ───
  const [qrColor, setQrColor] = useState('#0D0D0D');

  const viewShotRef = useRef(null);

  // Real Persistent Generation Matrix Bootstrap Lifecycle
  useEffect(() => {
    const loadGenerationLogs = async () => {
      try {
        const rawJson = await AsyncStorage.getItem(GENERATES_STORAGE_KEY);
        if (rawJson) {
          setGenerateHistory(JSON.parse(rawJson));
        }
      } catch (e) {
        console.error("Failed to load historical generation arrays:", e);
      }
    };
    loadGenerationLogs();
  }, []);

  useEffect(() => {
    if (popupVisible && isCreating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonOpacity, { toValue: 0.8, duration: 600, useNativeDriver: true }),
          Animated.timing(skeletonOpacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      skeletonOpacity.setValue(0.3);
    }
  }, [popupVisible, isCreating, skeletonOpacity]);

  const handleGenerate = () => {
    const text = inputText.trim();
    if (!text) {
      Alert.alert('Empty Input', 'Please enter text or a URL to generate a QR code.');
      return;
    }

    setLoadingPhrase(getRandomPhrase());
    setGenerationError(null);
    setIsCreating(true);
    setPopupVisible(true);

    setTimeout(async () => {
      try {
        setDisplayQR(text);
        
        // Add new record into local list logic
        const newItem = { id: Date.now().toString(), data: text, created_at: new Date().toISOString() };
        const updatedArray = [newItem, ...generateHistory];
        
        setGenerateHistory(updatedArray);
        await AsyncStorage.setItem(GENERATES_STORAGE_KEY, JSON.stringify(updatedArray));
        
        setIsCreating(false);
        setInputText('');
      } catch (error) {
        console.error(error);
        setGenerationError(error.message || "Unknown Core Exception occurred.");
        setIsCreating(false);
      }
    }, 3000);
  };

  const handleItemPress = (item) => {
    setHistoryVisible(false);
    setLoadingPhrase(getRandomPhrase());
    setGenerationError(null);
    setIsCreating(true);
    setPopupVisible(true);
    setTimeout(() => {
      try {
        setDisplayQR(item.data);
        setIsCreating(false);
        setInputText('');
      } catch (error) {
        setGenerationError(error.message || "Failed to rebuild historical matrix frame.");
        setIsCreating(false);
      }
    }, 3000);
  };

  const pickLogoImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access gallery is required to select a logo.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSaveImage = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Error', 'QR code preview is not ready.');
        return;
      }
      const uri = await viewShotRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync(true);

      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        if (Platform.OS === 'android') {
          ToastAndroid.show('QR Code saved to gallery!', ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', 'QR Code saved to your gallery!');
        }
      } else {
        handleShareFallback(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to execute save operation.');
      console.error(error);
    }
  };

  const handleShareNative = async () => {
    try {
      if (!viewShotRef.current) return;
      const uri = await viewShotRef.current.capture();
      handleShareFallback(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to prepare share file payload.');
    }
  };

  const handleShareFallback = async (capturedUri) => {
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      const customUri = `${FileSystem.cacheDirectory}QRCode_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: capturedUri, to: customUri });
      await Sharing.shareAsync(customUri, {
        mimeType: 'image/png',
        dialogTitle: 'Save or Share your QR Code',
      });
    } else {
      Alert.alert('Unavailable', 'Native sharing system is not available.');
    }
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        contentContainerStyle={styles.generateContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.generateTitle}>Generate QR Code</Text>
        <Text style={styles.generateSubtitle}>Paste or type your endpoint content below</Text>

        <View style={styles.focusedInputContainer}>
          <Text style={styles.inputHeadingLabel}>Content URL / Text Input</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., https://google.com or special text parameters…"
            placeholderTextColor={TEXT_MUTED}
            value={inputText}
            onChangeText={setInputText}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.accordionContainer, !optionsCollapsed && styles.accordionContainerExpanded]}>
          <TouchableOpacity 
            style={[styles.accordionHeaderButton, !optionsCollapsed && styles.accordionHeaderButtonActive]}
            onPress={() => setOptionsCollapsed(!optionsCollapsed)}
            activeOpacity={0.85}
          >
            <View style={styles.accordionHeaderInner}>
              <View style={styles.accordionTitleWithIcon}>
                <Image 
                  source={require('./assets/color-palette.png')} 
                  style={styles.inlineLabelIconImage} 
                />
                <Text style={styles.accordionTitleText}>Customize Styling & Colors</Text>
              </View>
              <Text style={[styles.accordionArrowIcon, !optionsCollapsed && styles.accordionArrowIconActive]}>
                {optionsCollapsed ? '▼' : '▲'}
              </Text>
            </View>
            {optionsCollapsed && (
              <Text style={styles.accordionSubhint}>QR block color, overlays, label typography</Text>
            )}
          </TouchableOpacity>

          {!optionsCollapsed && (
            <View style={styles.optionsContainer}>
              
              {/* ─── ADDED: QR Code Color Picker Customizer ─── */}
              <Text style={localStyles.customizerHeading}>1. QR Code Vector Color</Text>
              <View style={styles.colorPickerGrid}>
                {/* Fallback option for standard sharp dark matrix layout block */}
                <TouchableOpacity
                  style={[
                    styles.colorBubble, 
                    { backgroundColor: '#0D0D0D', borderWidth: 1, borderColor: '#555' },
                    qrColor.toLowerCase() === '#0d0d0d' && styles.colorBubbleActive
                  ]}
                  onPress={() => setQrColor('#0D0D0D')}
                />
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`qr-preset-${color}`}
                    style={[
                      styles.colorBubble, 
                      { backgroundColor: color },
                      qrColor.toLowerCase() === color.toLowerCase() && styles.colorBubbleActive
                    ]}
                    onPress={() => setQrColor(color)}
                  />
                ))}
              </View>
              <TextInput
                style={[styles.smallInput, { marginBottom: 16 }]}
                placeholder="Custom QR Code Color Hex (e.g., #00FFCC)"
                placeholderTextColor={TEXT_MUTED}
                value={qrColor}
                onChangeText={setQrColor}
                autoCapitalize="characters"
              />

              <Text style={localStyles.customizerHeading}>2. Bottom Text Label Overlay</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="Custom Label Text Below QR"
                placeholderTextColor={TEXT_MUTED}
                value={label}
                onChangeText={setLabel}
              />

              <Text style={styles.labelStyleHint}>Center Logo Image Graphic</Text>
              <View style={styles.imagePickerRow}>
                <TouchableOpacity style={styles.pickerInlineBtn} onPress={pickLogoImage} activeOpacity={0.7}>
                  <View style={styles.pickerButtonContent}>
                    <Image 
                      source={require('./assets/gallery.png')} 
                      style={styles.pickerIconImage} 
                    />
                    <Text style={styles.pickerInlineBtnText}>
                      {logoUri ? 'Change Center Logo' : 'Pick Logo from Gallery'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {logoUri ? (
                  <TouchableOpacity style={styles.clearLogoBtn} onPress={() => setLogoUri('')}>
                    <Text style={styles.clearLogoBtnText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              
              {logoUri ? (
                <View style={styles.logoPreviewContainer}>
                  <Text style={styles.labelStyleHint}>Preview Selected Center Embedded Graphic:</Text>
                  <Image source={{ uri: logoUri }} style={styles.logoPreviewImage} />
                </View>
              ) : null}

              <View style={styles.inlineOptions}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelStyleHint}>Font Size</Text>
                  <TextInput
                    style={styles.smallInput}
                    keyboardType="numeric"
                    placeholder="14"
                    placeholderTextColor={TEXT_MUTED}
                    value={fontSize}
                    onChangeText={setFontSize}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.labelStyleHint}>Text Label Hex Code</Text>
                  <TextInput
                    style={styles.smallInput}
                    placeholder="#333333"
                    placeholderTextColor={TEXT_MUTED}
                    value={fontColor}
                    onChangeText={setFontColor}
                  />
                </View>
              </View>

              <Text style={styles.labelStyleHint}>Label Color Presets Picker</Text>
              <View style={styles.colorPickerGrid}>
                {COLOR_PRESETS.map((color) => (
                  <TouchableOpacity
                    key={`text-preset-${color}`}
                    style={[
                      styles.colorBubble, 
                      { backgroundColor: color },
                      fontColor.toLowerCase() === color.toLowerCase() && styles.colorBubbleActive
                    ]}
                    onPress={() => setFontColor(color)}
                  />
                ))}
              </View>

              <View style={styles.toggleRow}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, fontWeightValue >= 700 && styles.toggleBtnActive]}
                  onPress={() => setFontWeightValue(fontWeightValue >= 700 ? 400 : 700)}
                >
                  <Text style={[styles.toggleBtnText, fontWeightValue >= 700 && styles.toggleBtnTextActive]}>Bold</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.toggleBtn, fontStyle === 'italic' && styles.toggleBtnActive]}
                  onPress={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
                >
                  <Text style={[styles.toggleBtnText, fontStyle === 'italic' && styles.toggleBtnTextActive]}>Italic</Text>
                </TouchableOpacity>
              </View>

              <WeightSlider value={fontWeightValue} onValueChange={setFontWeightValue} min={100} max={900} />
            </View>
          )}
        </View>

        <View style={styles.generateInlineButtonWrapper}>
          <InlineHistoryBar 
            count={generateHistory.length} 
            label="Generated History Logs" 
            onPress={() => setHistoryVisible(true)} 
          />
        </View>

        <TouchableOpacity style={styles.generateActionButton} onPress={handleGenerate} activeOpacity={0.85}>
          <View style={styles.generateButtonInner}>
            <Image 
              source={require('./assets/qr-code.png')} 
              style={styles.generateButtonIconImage} 
            />
            <Text style={styles.generateActionButtonText}>Start Generating!</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <HistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        title="Generated History"
        items={generateHistory}
        emptyText="No QR codes generated yet."
        onItemPress={handleItemPress}
      />

      <Modal transparent visible={popupVisible} animationType="fade" onRequestClose={() => setPopupVisible(false)}>
        <View style={[styles.centerPopupOverlay, isCreating && styles.loadingScreenBackground]}>
          <View style={[styles.popupCard, generationError && styles.popupCardError]}>
            
            <View style={styles.popupHeaderRow}>
              <Text style={[styles.popupCardTitle, generationError && styles.popupCardTitleError]}>
                {isCreating 
                  ? 'Engine Processing...' 
                  : generationError 
                    ? 'System Anomaly Detected' 
                    : 'Matrix Vector Compiled'}
              </Text>
              {!isCreating && (
                <TouchableOpacity style={styles.popupCloseCircle} onPress={() => setPopupVisible(false)}>
                  <Text style={styles.popupCloseCircleText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {isCreating ? (
              <View style={styles.skeletonTargetContainer}>
                <Animated.View style={[styles.skeletonSquare, { opacity: skeletonOpacity }]} />
                <Animated.View style={[styles.skeletonTextLine, { opacity: skeletonOpacity, width: '70%' }]} />
                <Animated.View style={[styles.skeletonTextLine, { opacity: skeletonOpacity, width: '45%' }]} />
                <Text style={styles.skeletonLoaderMessage}>{loadingPhrase}</Text>
              </View>
            ) : generationError ? (
              <View style={styles.errorProductContainer}>
                <Image 
                  source={require('./assets/planet.png')} 
                  style={styles.errorCenteredImage} 
                />
                <Text style={styles.errorHeadingText}>Something Went Wrong</Text>
                <Text style={styles.errorSubheadingText}>{generationError}</Text>

                <TouchableOpacity style={styles.errorRetryBtn} onPress={handleGenerate} activeOpacity={0.8}>
                  <Text style={styles.errorRetryBtnText}>⟳ Retry Compilation Pipeline</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.popupDismissBtn} onPress={() => setPopupVisible(false)}>
                  <Text style={styles.popupDismissBtnText}>Close Modal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.completedProductContainer}>
                <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }}>
                  <View style={styles.qrContainer}>
                    <QRCode 
                      value={displayQR} 
                      size={200} 
                      color={qrColor || "#0D0D0D"} // ─── UPDATED: Dynamic Foreground Vector Injection ───
                      backgroundColor="#F7F5F0"
                      logo={logoUri ? { uri: logoUri } : undefined}
                      logoSize={44}
                      ecl="H"
                      logoBackgroundColor="#F7F5F0"
                      logoMargin={5}
                      logoBorderRadius={8}
                    />
                    <Text 
                      style={[
                        styles.qrLabel,
                        {
                          fontSize: Number(fontSize) || 14,
                          fontWeight: String(fontWeightValue),
                          color: fontColor || '#333333',
                          fontStyle: fontStyle
                        }
                      ]}
                    >
                      {label || displayQR}
                    </Text>
                  </View>
                </ViewShot>

                <View style={styles.popupActionsGrid}>
                  <TouchableOpacity style={[styles.popupActionBtn, styles.downloadActionBtn]} onPress={handleSaveImage}>
                    <View style={styles.actionButtonInnerContent}>
                      <Image 
                        source={require('./assets/download.png')} 
                        style={styles.actionButtonIconImage} 
                      />
                      <Text style={styles.popupActionBtnText}>Download</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.popupActionBtn, styles.shareActionBtn]} onPress={handleShareNative}>
                     <Image 
                        source={require('./assets/download.png')} 
                        style={styles.actionButtonIconImage} 
                      />
                    <Text style={styles.popupActionBtnText}> Share QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <Text style={styles.creditText}>created by noel padrigon</Text>
    </View>
  );
}

// ─── Export Tab Controllers ──────────────────────────────────────────────────
export { ScanTab, GenerateTab };

// --- Dynamic Styling Extensions Sheet ---
const localStyles = StyleSheet.create({
  customizerHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 8,
  },
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

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareSystem() {
      try {
        // 1. Fire off your database initialization process right away
        await getDB();
        
        // 2. Keep the native splash screen locked for at least 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      } catch (e) {
        console.warn('Initialization anomaly:', e);
      } finally {
        // 3. Mark state as ready and clear the native splash layer
        setAppIsReady(true);
        await SplashScreen.hideAsync().catch(() => {/* noop */});
      }
    }

    prepareSystem();
  }, []);

  // Return null or an empty layout *only* while the native splash screen is actively masking the screen
  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        <View style={styles.content}>
          {activeTab === 'scan' ? <ScanTab /> : <GenerateTab />}
        </View>

        <View style={styles.tabBar}>
          {['scan', 'generate'].map((tab) => {
            const isActive = activeTab === tab;
            const targetIconSource = tab === 'scan' 
              ? require('./assets/scanner.png') 
              : require('./assets/qr-code.png');

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBarItem, isActive && styles.tabBarItemActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Image 
                  source={targetIconSource} 
                  style={[styles.tabBarIconImage, isActive && styles.tabBarIconImageActive]} 
                />
                <Text style={[styles.tabBarLabel, isActive && styles.tabBarLabelActive]}>
                  {tab === 'scan' ? 'Scan' : 'Generate'}
                </Text>
                {isActive && <View style={styles.tabBarIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </RNSafeAreaView>
    </SafeAreaProvider>
  );
}