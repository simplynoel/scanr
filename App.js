import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, StatusBar, SafeAreaView } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// --- Safe Area Setup ---
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

// --- Component Imports ---
import QRScanner from './components/QRScanner';
import QRGenerator from './components/QRGenerator';
import styles, { BG } from './styles';

// Keep the native splash screen locked until we are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// --- Mock Database Initialization ---
async function getDB() {
  // Initialize database logic here
  return Promise.resolve();
}

export default function App() {
  const [activeTab, setActiveTab] = useState('scan');
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareSystem() {
      try {
        await getDB();
        // Keep splash screen visible for at least 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn('Initialization anomaly:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepareSystem();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <RNSafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={BG} />

        <View style={styles.content}>
          {activeTab === 'scan' ? <QRScanner /> : <QRGenerator />}
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