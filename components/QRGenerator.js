import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, TextInput, Image, 
  Alert, Platform, ToastAndroid, Modal, Animated, StyleSheet 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import styles, { TEXT_MUTED } from '../styles';

// Direct pipeline bundle reference to your static asset file source path
const APP_DEFAULT_LOGO = require('../assets/main-logo.png');

const GENERATES_STORAGE_KEY = '@qr_reader_generates_v1';
const _PHRASES = ['Crunching bits...', 'Synthesizing code...', 'Generating pixels...'];

const REM = 16;

export default function QRGenerator() {
  const [inputText, setInputText] = useState('');
  const [displayQR, setDisplayQR] = useState('');
  const [generateHistory, setGenerateHistory] = useState([]);
  const [optionsCollapsed, setOptionsCollapsed] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [loadingPhrase, setLoadingPhrase] = useState('');
  
  // Custom Override Media Stream Graphic Token
  const [logoUri, setLogoUri] = useState('');

  const viewShotRef = useRef(null);
  const skeletonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const rawJson = await AsyncStorage.getItem(GENERATES_STORAGE_KEY);
        if (rawJson) setGenerateHistory(JSON.parse(rawJson));
      } catch (e) { console.error(e); }
    };
    loadHistory();
  }, []);

  const handleGenerate = () => {
    const text = inputText.trim();
    if (!text) {
      Alert.alert('Empty Input', 'Please enter text or a URL.');
      return;
    }

    setLoadingPhrase(_PHRASES[Math.floor(Math.random() * _PHRASES.length)]);
    setIsCreating(true);
    setPopupVisible(true);

    setTimeout(async () => {
      try {
        setDisplayQR(text);
        const newItem = { id: Date.now().toString(), data: text, created_at: new Date().toISOString() };
        const updatedArray = [newItem, ...generateHistory];
        
        setGenerateHistory(updatedArray);
        await AsyncStorage.setItem(GENERATES_STORAGE_KEY, JSON.stringify(updatedArray));
        
        setIsCreating(false);
        setInputText('');
      } catch (error) {
        Alert.alert('Error', 'Failed to save to history.');
        setIsCreating(false);
      }
    }, 1500);
  };

  const pickLogoImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need gallery access to pick a logo.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 1 
    });
    if (!result.canceled) setLogoUri(result.assets[0].uri);
  };

  // Restored: Export pipeline to save file locally or trigger share configurations
  const handleSaveImage = async () => {
    if (!viewShotRef.current) return;
    try {
      const uri = await viewShotRef.current.capture();
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        if (Platform.OS === 'android') ToastAndroid.show('Saved to gallery!', ToastAndroid.SHORT);
        else Alert.alert('Success', 'Saved to gallery!');
      } else {
        await Sharing.shareAsync(uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save image.');
    }
  };

  return (
    <View style={[styles.tabContainer, localStyles.mainWrapper]}>
      <ScrollView 
        contentContainerStyle={localStyles.scrollContentContainer} 
        keyboardShouldPersistTaps="handled"
      >
        {/* Core Generator Module Group */}
        <View style={localStyles.interactiveFormGroup}>
          <Text style={styles.generateTitle}>Generate QR Code</Text>
          
          <View style={styles.focusedInputContainer}>
            <Text style={styles.inputHeadingLabel}>Content URL / Text</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., https://google.com"
              placeholderTextColor={TEXT_MUTED}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>

          <View style={[styles.accordionContainer, !optionsCollapsed && styles.accordionContainerExpanded]}>
            <TouchableOpacity style={styles.accordionHeaderButton} onPress={() => setOptionsCollapsed(!optionsCollapsed)}>
              <Text style={styles.accordionTitleText}>Customize Design (optional)</Text>
            </TouchableOpacity>

            {!optionsCollapsed && (
              <View style={styles.optionsContainer}>
                <Text style={localStyles.customizerHeading}>Override Center Logo</Text>
                
                {!logoUri ? (
                  <TouchableOpacity 
                    style={localStyles.uploadZoneEmpty} 
                    onPress={pickLogoImage}
                    activeOpacity={0.7}
                  >
                    <Text style={localStyles.uploadPlusIcon}>+</Text>
                    <Text style={localStyles.uploadMainText}>Tap to Upload Custom Logo</Text>
                    <Text style={localStyles.uploadSubText}>Otherwise, app main-logo will be used by default</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={localStyles.uploadZoneFilled}>
                    <Image source={{ uri: logoUri }} style={localStyles.logoPreview} />
                    <View style={localStyles.filledActions}>
                      <Text style={localStyles.logoActiveLabel}>Custom Override Active</Text>
                      <View style={localStyles.filledButtonsRow}>
                        <TouchableOpacity style={localStyles.actionLinkBtn} onPress={pickLogoImage}>
                          <Text style={localStyles.changeLinkText}>Change Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={localStyles.actionLinkBtn} onPress={() => setLogoUri('')}>
                          <Text style={localStyles.removeLinkText}>Reset to Default</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.generateActionButton} onPress={handleGenerate}>
            <Text style={styles.generateActionButtonText}>Generate QR</Text>
          </TouchableOpacity>
        </View>

        {/* Branding Footer Node */}
        <View style={localStyles.attributionFooter}>
          <Text style={localStyles.attributionText}>created by Noel Padrigon</Text>
        </View>
      </ScrollView>

      {/* Modern Refined Result Modal UI */}
      <Modal transparent visible={popupVisible} animationType="fade" onRequestClose={() => setPopupVisible(false)}>
        <View style={localStyles.modernPopupOverlay}>
          <View style={localStyles.modernPopupCard}>
            {isCreating ? (
              <View style={localStyles.modernLoadingContainer}>
                <Text style={localStyles.modernLoadingText}>{loadingPhrase}</Text>
              </View>
            ) : (
              <View style={localStyles.modernResultContainer}>
                <View style={localStyles.modalHeaderTrack}>
                  <Text style={localStyles.modalHeaderTitle}>QR Code Ready</Text>
                  <Text style={localStyles.modalHeaderSubtitle}>Generated successfully and ready for production</Text>
                </View>

                <View style={localStyles.premiumArtboardFrame}>
                  <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} style={localStyles.modernShotPadding}>
                    <QRCode 
                      value={displayQR} 
                      size={200} 
                      color="#000000"
                      logo={logoUri ? { uri: logoUri } : APP_DEFAULT_LOGO} 
                      logoSize={50}
                      logoBackgroundColor="#FFFFFF"
                      logoBorderRadius={10}
                    />
                  </ViewShot>
                </View>

                <View style={localStyles.modalActionFooterGroup}>
                  <TouchableOpacity 
                    style={[styles.generateActionButton, localStyles.noMarginOverride]} 
                    onPress={handleSaveImage}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.generateActionButtonText}>Export to Gallery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={() => setPopupVisible(false)} 
                    style={localStyles.modalCloseButtonLink}
                    activeOpacity={0.7}
                  >
                    <Text style={localStyles.modalCloseButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: REM,
    paddingBottom: Platform.OS === 'ios' ? REM + 8 : REM,
  },
  interactiveFormGroup: {
    width: '100%',
  },
  attributionFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 8,
    width: '100%',
  },
  attributionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
  customizerHeading: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', marginTop: 10, marginBottom: 12 },
  uploadZoneEmpty: {
    borderWidth: 2,
    borderColor: '#444444',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#151515',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadPlusIcon: { fontSize: 28, color: '#00E676', fontWeight: '600', marginBottom: 4 },
  uploadMainText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  uploadSubText: { fontSize: 11, color: '#888888', textAlign: 'center' },
  uploadZoneFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  logoPreview: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#000' },
  filledActions: { flex: 1, marginLeft: 14 },
  logoActiveLabel: { fontSize: 13, fontWeight: '600', color: '#00E676', marginBottom: 6 },
  filledButtonsRow: { flexDirection: 'row' },
  actionLinkBtn: { marginRight: 16, paddingVertical: 2 },
  changeLinkText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
  removeLinkText: { color: '#FF453A', fontSize: 12, fontWeight: '600' },

  modernPopupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 12, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: REM * 1.5,
  },
  modernPopupCard: {
    backgroundColor: '#1A1A1E',
    borderRadius: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#2C2C32',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  modernLoadingContainer: { paddingVertical: 60, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  modernLoadingText: { fontSize: 15, fontWeight: '500', color: '#A1A1AA', letterSpacing: 0.3 },
  modernResultContainer: { padding: 24, alignItems: 'center' },
  modalHeaderTrack: { alignItems: 'center', marginBottom: 20, width: '100%' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 6, letterSpacing: 0.2 },
  modalHeaderSubtitle: { fontSize: 12, color: '#A1A1AA', textAlign: 'center', lineHeight: 16, paddingHorizontal: 10 },
  premiumArtboardFrame: {
    backgroundColor: '#111115',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C32',
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernShotPadding: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  modalActionFooterGroup: { width: '100%', alignItems: 'center' },
  noMarginOverride: { marginTop: 0, width: '100%' },
  modalCloseButtonLink: { marginTop: 16, paddingVertical: 8, paddingHorizontal: 24, width: '100%', alignItems: 'center' },
  modalCloseButtonText: { color: '#A1A1AA', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
});