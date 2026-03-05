import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';
import { useLevelStore } from '../../store/levelStore';

interface LevelCardProps {
  darkMode: boolean;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Seedling',
  2: 'Sprout',
  3: 'Sapling',
  4: 'Young Tree',
  5: 'Growing Tree',
  6: 'Mature Tree',
  7: 'Elder Tree',
  8: 'Ancient Oak',
  9: 'Forest Guardian',
  10: 'Forest Legend',
};

const LevelCard = memo(function LevelCard({ darkMode }: LevelCardProps) {
  const { totalPoints, level, progressToNextLevel, pointsInCurrentLevel, pointsNeededForNextLevel } =
    useLevelStore();

  const title = LEVEL_TITLES[level] ?? `Level ${level}`;

  return (
    <View style={[styles.card, darkMode && styles.cardDark]}>
      <View style={styles.topRow}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>Lv.{level}</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={[styles.levelTitle, darkMode && styles.textDark]}>{title}</Text>
          <Text style={[styles.pointsText, darkMode && styles.subtextDark]}>
            {totalPoints.toLocaleString()} total points
          </Text>
        </View>
        <View style={styles.pointsPill}>
          <Text style={styles.pointsPillText}>⭐ {totalPoints}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressTrack, darkMode && styles.progressTrackDark]}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(progressToNextLevel * 100, 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.progressLabel, darkMode && styles.subtextDark]}>
          {pointsInCurrentLevel} / {pointsNeededForNextLevel} to next level
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardDark: {
    backgroundColor: COLORS.surfaceDark,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  titleCol: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  textDark: {
    color: COLORS.textDark,
  },
  pointsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subtextDark: {
    color: COLORS.textSecondaryDark,
  },
  pointsPill: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pointsPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F57C00',
  },
  progressBarContainer: {
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
    overflow: 'hidden',
  },
  progressTrackDark: {
    backgroundColor: '#1A2E1A',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primaryLight,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});

export { LevelCard };
