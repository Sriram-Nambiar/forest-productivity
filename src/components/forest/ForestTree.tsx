import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';

interface ForestTreeProps {
  /** 0.6 – 1.2 for depth effect */
  scale?: number;
  /** true = dead tree (no leaves, tilted, dark) */
  isDead?: boolean;
}

const TREE_W = 60;
const TREE_H = 70;

const ForestTree = memo(function ForestTree({ scale = 1, isDead = false }: ForestTreeProps) {
  if (isDead) {
    return (
      <View
        style={[
          styles.container,
          {
            transform: [{ scale }, { rotate: '5deg' }],
            opacity: 0.55,
          },
        ]}
      >
        <Svg width={TREE_W} height={TREE_H} viewBox="0 0 60 70">
          {/* Shadow / ground */}
          <Ellipse cx={30} cy={66} rx={12} ry={2.5} fill="rgba(0,0,0,0.12)" />

          {/* Dead trunk — thinner, darker */}
          <Rect x={28} y={38} width={5} height={26} rx={1.5} fill="#4E342E" />

          {/* Left branch — bare, broken */}
          <Line x1={30} y1={48} x2={16} y2={34} stroke="#5D4037" strokeWidth={2} strokeLinecap="round" />
          <Line x1={16} y1={34} x2={12} y2={28} stroke="#5D4037" strokeWidth={1.5} strokeLinecap="round" />

          {/* Right branch — bare, broken */}
          <Line x1={30} y1={43} x2={44} y2={30} stroke="#5D4037" strokeWidth={2} strokeLinecap="round" />
          <Line x1={44} y1={30} x2={48} y2={24} stroke="#5D4037" strokeWidth={1.5} strokeLinecap="round" />

          {/* Upper branch stubs */}
          <Line x1={30} y1={40} x2={22} y2={28} stroke="#6D4C41" strokeWidth={1.5} strokeLinecap="round" />
          <Line x1={30} y1={40} x2={38} y2={26} stroke="#6D4C41" strokeWidth={1.5} strokeLinecap="round" />

          {/* Broken top */}
          <Line x1={30} y1={38} x2={30} y2={22} stroke="#5D4037" strokeWidth={2} strokeLinecap="round" />
          <Line x1={30} y1={22} x2={26} y2={18} stroke="#5D4037" strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  // ─── Alive tree (unchanged from original) ───
  const leafDark = '#2E7D32';
  const leafMid = '#4CAF50';
  const leafLight = '#81C784';
  const trunk = '#6D4C41';
  const branch = '#795548';

  return (
    <View
      style={[
        styles.container,
        {
          transform: [{ scale }],
          opacity: 1,
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
