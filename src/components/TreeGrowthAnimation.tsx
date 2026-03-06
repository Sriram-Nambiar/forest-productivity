import React, { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    SharedValue,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

// Create animated SVG primitives
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedG = Animated.createAnimatedComponent(G);

// ─── SVG Dimensions ───
const SVG_W = 240;
const SVG_H = 280;

// ─── Colors ───
const ALIVE_TRUNK = '#69463c';
const ALIVE_BRANCH = '#795546';
const ALIVE_LEAF_DARK = '#2E7D32';
const ALIVE_LEAF_MID = '#4CAF50';
const ALIVE_LEAF_LIGHT = '#81C784';
const ALIVE_ROOT = '#5D4037';
const ALIVE_SEED = '#8D6E63';
const ALIVE_GROUND = '#1B5E20';

const DEAD_TRUNK = '#5D4037';
const DEAD_BRANCH = '#6D4C41';
const DEAD_LEAF = '#795548';
const DEAD_ROOT = '#4E342E';
const DEAD_SEED = '#6D4C41';
const DEAD_GROUND = '#4E342E';

// ─── Timing config ───
const TIMING_CONFIG = {
  duration: 800,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

// ─── Root paths ───
const ROOT_PATHS = [
  'M120 230 Q110 250 95 265',
  'M120 230 Q120 255 120 270',
  'M120 230 Q130 250 145 265',
  'M120 230 Q105 245 85 255',
  'M120 230 Q135 245 155 255',
];

// ─── Branch definitions ───
const BRANCHES = [
  { x1: 120, y1: 165, x2: 80,  y2: 140 },
  { x1: 120, y1: 185, x2: 75,  y2: 170 },
  { x1: 120, y1: 150, x2: 85,  y2: 120 },
  { x1: 120, y1: 160, x2: 160, y2: 135 },
  { x1: 120, y1: 180, x2: 165, y2: 165 },
  { x1: 120, y1: 145, x2: 155, y2: 115 },
];

// ─── Leaf clusters ───
const LEAVES: Array<{ cx: number; cy: number; r: number; colorIdx: number }> = [
  { cx: 120, cy: 90,  r: 18, colorIdx: 0 },
  { cx: 100, cy: 100, r: 15, colorIdx: 1 },
  { cx: 140, cy: 100, r: 15, colorIdx: 1 },
  { cx: 120, cy: 75,  r: 14, colorIdx: 2 },
  { cx: 85,  cy: 120, r: 16, colorIdx: 1 },
  { cx: 155, cy: 115, r: 16, colorIdx: 1 },
  { cx: 105, cy: 110, r: 14, colorIdx: 0 },
  { cx: 135, cy: 108, r: 14, colorIdx: 0 },
  { cx: 75,  cy: 135, r: 13, colorIdx: 2 },
  { cx: 165, cy: 130, r: 13, colorIdx: 2 },
  { cx: 80,  cy: 148, r: 11, colorIdx: 0 },
  { cx: 160, cy: 145, r: 11, colorIdx: 0 },
  { cx: 95,  cy: 142, r: 12, colorIdx: 1 },
  { cx: 145, cy: 140, r: 12, colorIdx: 1 },
  { cx: 110, cy: 125, r: 10, colorIdx: 2 },
  { cx: 130, cy: 123, r: 10, colorIdx: 2 },
];

const ROOT_TOTAL_LENGTH = 60;

function getLeafColor(idx: number, dead: boolean): string {
  if (dead) return DEAD_LEAF;
  switch (idx) {
    case 0: return ALIVE_LEAF_DARK;
    case 1: return ALIVE_LEAF_MID;
    case 2: return ALIVE_LEAF_LIGHT;
    default: return ALIVE_LEAF_MID;
  }
}

// ─── Sub-components to avoid hooks-in-loops violation ───

interface RootPathProps {
  d: string;
  index: number;
  animProgress: SharedValue<number>;
  color: string;
}

const RootPath = memo(function RootPath({ d, index, animProgress, color }: RootPathProps) {
  const animatedProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const startAt = 0.05 + index * 0.02;
    const endAt = startAt + 0.12;
    const draw = interpolate(p, [startAt, endAt], [0, 1], Extrapolation.CLAMP);
    const offset = ROOT_TOTAL_LENGTH * (1 - draw);
    const opacity = interpolate(p, [startAt, startAt + 0.01], [0, 1], Extrapolation.CLAMP);
    return { strokeDashoffset: offset, opacity };
  });

  return (
    <AnimatedPath
      d={d}
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${ROOT_TOTAL_LENGTH},${ROOT_TOTAL_LENGTH}`}
      animatedProps={animatedProps}
    />
  );
});

interface BranchLineProps {
  branch: typeof BRANCHES[number];
  index: number;
  animProgress: SharedValue<number>;
  color: string;
}

const BranchLine = memo(function BranchLine({ branch, index, animProgress, color }: BranchLineProps) {
  const animatedProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const startAt = 0.4 + index * 0.03;
    const endAt = startAt + 0.15;
    const draw = interpolate(p, [startAt, endAt], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(p, [startAt, startAt + 0.02], [0, 1], Extrapolation.CLAMP);
    const bx = interpolate(draw, [0, 1], [branch.x1, branch.x2], Extrapolation.CLAMP);
    const by = interpolate(draw, [0, 1], [branch.y1, branch.y2], Extrapolation.CLAMP);
    return { x2: bx, y2: by, opacity };
  });

  return (
    <AnimatedLine
      x1={branch.x1}
      y1={branch.y1}
      animatedProps={animatedProps}
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  );
});

interface LeafCircleProps {
  leaf: typeof LEAVES[number];
  index: number;
  animProgress: SharedValue<number>;
  failed: boolean;
}

const LeafCircle = memo(function LeafCircle({ leaf, index, animProgress, failed }: LeafCircleProps) {
  const animatedProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const startAt = 0.55 + index * 0.025;
    const endAt = startAt + 0.2;
    const scale = interpolate(p, [startAt, endAt], [0, 1], Extrapolation.CLAMP);
    const opacity = interpolate(p, [startAt, startAt + 0.05], [0, 0.9], Extrapolation.CLAMP);
    return { r: leaf.r * scale, opacity };
  });

  return (
    <AnimatedCircle
      cx={leaf.cx}
      cy={leaf.cy}
      fill={getLeafColor(leaf.colorIdx, failed)}
      animatedProps={animatedProps}
    />
  );
});

// ─── Main component ───

interface TreeGrowthAnimationProps {
  progress: number; // 0 → 1
  failed?: boolean;
}

const TreeGrowthAnimation = memo(function TreeGrowthAnimation({
  progress,
  failed = false,
}: TreeGrowthAnimationProps) {
  const animProgress = useSharedValue(progress);

  useEffect(() => {
    animProgress.value = withTiming(progress, TIMING_CONFIG);
  }, [progress, animProgress]);

  // ─── Seed ───
  const seedProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const opacity = interpolate(p, [0, 0.05, 0.15], [1, 1, 0], Extrapolation.CLAMP);
    const scale = interpolate(p, [0, 0.05, 0.1], [1, 1.2, 0.5], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  // ─── Ground ───
  const groundProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const scaleX = interpolate(p, [0, 0.05, 1], [0.3, 0.6, 1], Extrapolation.CLAMP);
    const opacity = interpolate(p, [0, 0.02], [0, 1], Extrapolation.CLAMP);
    return { opacity, transform: [{ scaleX }] };
  });

  // ─── Trunk ───
  const trunkProps = useAnimatedProps(() => {
    const p = animProgress.value;
    const trunkMaxH = 90;
    const trunkH = interpolate(p, [0.15, 0.4], [0, trunkMaxH], Extrapolation.CLAMP);
    // Slimmer trunk: max width reduced from 16 → 10
    const trunkW = interpolate(p, [0.15, 0.4], [3, 10], Extrapolation.CLAMP);
    const opacity = interpolate(p, [0.14, 0.16], [0, 1], Extrapolation.CLAMP);
    return {
      y: 230 - trunkH,
      height: trunkH,
      width: trunkW,
      x: 120 - trunkW / 2,
      rx: trunkW / 4,
      opacity,
    };
  });

  const seedColor  = failed ? DEAD_SEED   : ALIVE_SEED;
  const groundColor = failed ? DEAD_GROUND : ALIVE_GROUND;
  const rootColor  = failed ? DEAD_ROOT   : ALIVE_ROOT;
  const trunkColor = failed ? DEAD_TRUNK  : ALIVE_TRUNK;
  const branchColor = failed ? DEAD_BRANCH : ALIVE_BRANCH;

  return (
    <View style={styles.container}>
      <Svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>

        {/* ── Ground ── */}
        <AnimatedG animatedProps={groundProps} origin={`${SVG_W / 2}, 230`}>
          <Rect x={40} y={228} width={160} height={5} rx={2.5} fill={groundColor} />
        </AnimatedG>

        {/* ── Seed ── */}
        <AnimatedG animatedProps={seedProps} origin="120, 222">
          <Circle cx={120} cy={222} r={8} fill={seedColor} />
          <Circle cx={117} cy={220} r={2} fill="#A1887F" opacity={0.6} />
        </AnimatedG>

        {/* ── Roots ── */}
        {ROOT_PATHS.map((d, i) => (
          <RootPath
            key={`root-${i}`}
            d={d}
            index={i}
            animProgress={animProgress}
            color={rootColor}
          />
        ))}

        {/* ── Trunk ── */}
        <AnimatedRect animatedProps={trunkProps} fill={trunkColor} />

        {/* ── Branches ── */}
        {BRANCHES.map((branch, i) => (
          <BranchLine
            key={`branch-${i}`}
            branch={branch}
            index={i}
            animProgress={animProgress}
            color={branchColor}
          />
        ))}

        {/* ── Leaves ── */}
        {LEAVES.map((leaf, i) => (
          <LeafCircle
            key={`leaf-${i}`}
            leaf={leaf}
            index={i}
            animProgress={animProgress}
            failed={failed}
          />
        ))}

      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: SVG_W,
    height: SVG_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { TreeGrowthAnimation };

