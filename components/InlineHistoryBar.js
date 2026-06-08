import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import styles from '../styles';

export default function InlineHistoryBar({ count, label, onPress }) {
  return (
    <TouchableOpacity style={styles.inlineHistoryBar} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.inlineHistoryInner}>
        <Text style={styles.inlineHistoryIcon}>◷</Text>
        <Text style={styles.inlineHistoryText}>View {label} ({count})</Text>
      </View>
      <Text style={styles.inlineHistoryArrow}>➔</Text>
    </TouchableOpacity>
  );
}
