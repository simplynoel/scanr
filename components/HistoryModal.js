import React, { useEffect, useRef } from 'react';
import { Animated, Modal, TouchableWithoutFeedback, View, Text, TouchableOpacity, ScrollView, Image, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import styles, { formatTime } from '../styles';

export default function HistoryModal({ visible, onClose, title, items, emptyText, onItemPress, renderRight }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleCopyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS === 'android') {
      // Android toast handled by app shell
    } else {
      Alert.alert('Copied', 'Text copied to device clipboard.');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.modalHandle} />

        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.modalCloseBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>{emptyText}</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.historyItemContainer}>
                <TouchableOpacity
                  style={styles.historyItem}
                  onPress={() => onItemPress && onItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.historyItemContent}>
                    <Text style={styles.historyItemData} numberOfLines={2}>{item.data}</Text>
                    <Text style={styles.historyItemTime}>{formatTime(item.scanned_at || item.generated_at)}</Text>
                  </View>
                  {renderRight && renderRight(item)}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.historyCopyButton}
                  onPress={() => handleCopyToClipboard(item.data)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.6}
                >
                  <Image
                    source={require('../assets/copy.png')}
                    style={styles.actionIconImage}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
