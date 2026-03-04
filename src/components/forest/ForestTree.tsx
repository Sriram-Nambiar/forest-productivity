import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect, Ellipse } from 'react-native-svg';

interface ForestTreeProps {
  /** 0.6 – 1.2 for depth effect */
  scale?: number;
  /** true = dead tree */
  failed?: boolean;
}

const TREE_W = 60;
const TREE_H = 70;

const ForestTree = memo(function ForestTree({ scale = 1, failed = false }: ForestTreeProps) {
  const leafDark = failed ? '#795548' : '#2E7D32';
  const leafMid = failed ? '#8D6E63' : '#4CAF50';
  const leafLight = failed ? '#A1887F' : '#81C784';
  const trunk = failed ? '#5D4037' : '#6D4C41';
  const branch = failed ? '#6D4C41' : '#795548';

  return (
    <View
      style={[
        styles.container,
        {
          transform: [{ scale }],
          opacity: failed ? 0.6 : 1,
        },
      ]}
    >
      <Svg width={TREE_W} height={TREE_H} viewBox="0 0 60 70">
        {/* Shadow / ground */}
        <Ellipse cx={30} cy={66} rx={14} ry={3} fill="rgba(0,0,0,0.15)" />

        {/* Trunk */}
        <Rect x={27} y={40} width={6} height={24} rx={2} fill={trunk} />

        {/* Left branch */}
        <Line x1={30} y1={48} x2={20} y2={38} stroke={branch} strokeWidth={2} strokeLinecap="round" />
        {/* Right branch */}
        <Line x1={30} y1={45} x2={40} y2={35} stroke={branch} strokeWidth={2} strokeLinecap="round" />

        {/* Canopy layers (back to front for 3D) */}
        <Circle cx={30} cy={28} r={16} fill={leafDark} />
        <Circle cx={22} cy={32} r={12} fill={leafMid} />
        <Circle cx={38} cy={30} r={12} fill={leafMid} />
        <Circle cx={30} cy={22} r={11} fill={leafLight} />
        <Circle cx={24} cy={26} r={8} fill={leafLight} opacity={0.7} />

        {/* Highlight */}
        <Circle cx={26} cy={18} r={4} fill="rgba(255,255,255,0.2)" />
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: TREE_W,
    height: TREE_H,
  },
});

export { ForestTree };
