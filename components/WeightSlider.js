import React, { useRef, useEffect } from 'react';
import { View, Text, PanResponder, Animated } from 'react-native';

export default function WeightSlider({ value = 400, onValueChange, min = 100, max = 900 }) {
  const width = 260;
  const knob = useRef(new Animated.Value(((value - min) / (max - min)) * width)).current;
  
  // Refs to track drag state and anchor point
  const startX = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    // Only intercept and animate via side-effects if the user isn't actively dragging
    if (!isDragging.current) {
      const pos = ((value - min) / (max - min)) * width;
      Animated.timing(knob, { toValue: pos, duration: 120, useNativeDriver: false }).start();
    }
  }, [value]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        // Cleanly capture the exact layout position where the interaction started
        startX.current = knob.__getValue();
      },
      onPanResponderMove: (e, gesture) => {
        // Calculate raw new position based off initial anchor point + total delta distance
        let x = startX.current + gesture.dx;
        if (x < 0) x = 0;
        if (x > width) x = width;
        
        // Move thumb smoothly under the user's finger instantly
        knob.setValue(x);

        // Convert coordinates back to weight values
        const percent = x / width;
        const rawVal = min + percent * (max - min);
        const newVal = Math.round(rawVal / 100) * 100; // Snaps to nearest 100
        
        if (onValueChange && newVal !== value) {
          onValueChange(newVal);
        }
      },
      onPanResponderRelease: () => {
        isDragging.current = false;
        // Animate neatly to the final snapped resting coordinate upon release
        const finalPos = ((value - min) / (max - min)) * width;
        Animated.timing(knob, { toValue: finalPos, duration: 100, useNativeDriver: false }).start();
      },
    })
  ).current;

  const trackStyle = { 
    width, 
    height: 28, 
    backgroundColor: '#2a2a2a', 
    borderRadius: 8, 
    justifyContent: 'center',
    position: 'relative'
  };

  return (
    <View style={{ width, alignItems: 'center', marginVertical: 8 }}>
      <Text style={{ color: '#DDD', fontSize: 12, marginBottom: 6 }}>
        Font Weight: {value}
      </Text>
      
      <View style={trackStyle}>
        <Animated.View
          {...pan.panHandlers}
          style={{ 
            position: 'absolute', 
            left: knob, 
            width: 24, 
            height: 24, 
            borderRadius: 12, 
            backgroundColor: '#0ff7ff', 
            // Centers thumb perfectly within the 28px tall track (28 - 24 = 4 / 2 = 2px)
            top: 2,
            // Offsets the thumb's left edge slightly to look centered at zero positions
            transform: [{ translateX: -12 }]
          }}
        />
      </View>
    </View>
  );
}