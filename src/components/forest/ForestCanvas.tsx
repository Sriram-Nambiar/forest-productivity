import React, { memo, useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';
import type { FocusSession } from '../../utils/types';
import { ForestTree } from './ForestTree';

interface ForestCanvasProps {
  sessions: FocusSession[];
  darkMode: boolean;
}

const SCREEN_W = Dimensions.get('window').width;
const CANVAS_W = SCREEN_W - 32; // horizontal padding
const ROW_SPACING = 55;
const TREES_PER_ROW = 6;

interface PlacedTree {
  key: string;
  x: number;
  y: number;
  scale: number;
  failed: boolean;
}

function computePlacements(sessions: FocusSession[]): PlacedTree[] {
  const trees: PlacedTree[] = [];
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    if (s.status !== 'completed') continue;

    const col = i % TREES_PER_ROW;
    const row = Math.floor(i / TREES_PER_ROW);

    // Deterministic "random" offset for natural look
    const seed = ((i * 73 + 37) % 97) / 97;
    const xJitter = (seed - 0.5) * 20;
    const yJitter = ((seed * 53) % 1) * 10;

    const x = (col / TREES_PER_ROW) * CANVAS_W + xJitter + 10;
    const y = row * ROW_SPACING + yJitter;

    // Depth effect: back rows are smaller
    const maxRows = Math.max(1, Math.ceil(sessions.length / TREES_PER_ROW));
    const depthRatio = maxRows > 1 ? row / (maxRows - 1) : 0.5;
    const scale = 0.7 + (1 - depthRatio) * 0.4; // front=1.1, back=0.7

    trees.push({
      key: s.id,
      x: Math.max(0, Math.min(x, CANVAS_W - 60)),
      y,
      scale,
      failed: false,
    });
  }
  return trees;
}

const ForestCanvas = memo(function ForestCanvas({ sessions, darkMode }: ForestCanvasProps) {
  const placements = useMemo(() => computePlacements(sessions), [sessions]);
  const completedCount = placements.length;
  const canvasHeight = Math.max(
    200,
    Math.ceil(completedCount / TREES_PER_ROW) * ROW_SPACING + 80,
  );

  if (completedCount === 0) {
    return (
      <View style={[styles.emptyCanvas, darkMode && styles.emptyCanvasDark]}>
        <Text style={styles.emptyEmoji}>🌱</Text>
        <Text style={[styles.emptyText, darkMode && styles.emptyTextDark]}>
          Your forest is empty
        </Text>
        <Text style={[styles.emptySubtext, darkMode && styles.emptySubtextDark]}>
          Complete focus sessions to grow trees
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.canvas, darkMode && styles.canvasDark, { height: canvasHeight }]}>
      {/* Ground gradient effect */}
      <View style={[styles.ground, darkMode && styles.groundDark]} />

      {placements.map((tree) => (
        <View
          key={tree.key}
          style={[
            styles.treeWrapper,
            {
              left: tree.x,
              top: tree.y,
              zIndex: Math.round(tree.y),
            },
          ]}
        >
          <ForestTree scale={tree.scale} failed={tree.failed} />
        </View>
      ))}

      {/* Tree count badge */}
      <View style={[styles.countBadge, darkMode && styles.countBadgeDark]}>
        <Text style={styles.countText}>🌳 {completedCount}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasDark: {
    backgroundColor: '#1A2E1A',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#A5D6A7',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  groundDark: {
    backgroundColor: '#2E4A2E',
  },
  treeWrapper: {
    position: 'absolute',
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(46,125,50,0.85)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeDark: {
    backgroundColor: 'rgba(76,175,80,0.3)',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCanvas: {
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCanvasDark: {
    backgroundColor: '#1A2E1A',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  emptyTextDark: {
    color: COLORS.textDark,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptySubtextDark: {
    color: COLORS.textSecondaryDark,
  },
});

export { ForestCanvas };
