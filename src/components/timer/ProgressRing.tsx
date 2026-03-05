import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  /** 0 to 1 */
  progress: number;
  /** Outer diameter */
  size?: number;
  /** Stroke thickness */
  strokeWidth?: number;
  /** Track color behind the progress */
  trackColor?: string;
  /** Progress color */
  progressColor?: string;
}

const ProgressRing = memo(function ProgressRing({
  progress,
  size = 260,
  strokeWidth = 6,
  trackColor = 'rgba(76,175,80,0.15)',
  progressColor = '#4CAF50',
}: ProgressRingProps) {
  const animatedProgress = useSharedValue(progress);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const offset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset: offset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference},${circumference}`}
          strokeLinecap="round"
          animatedProps={animatedProps}
          // Start from top (rotate -90°)
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { ProgressRing };
