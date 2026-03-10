import React, { useEffect } from "react";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  height: number;
  verified?: boolean;
}

export default function ElasticSpring({
  height,
  verified = false,
}: Props) {
  const animatedHeight = useSharedValue(0);
  const glowIntensity = useSharedValue(0);

  useEffect(() => {
    animatedHeight.value = withSpring(height, {
      damping: 9,
      stiffness: 140,
      mass: 0.6,
    });
  }, [height]);

  useEffect(() => {
    if (verified) {
      glowIntensity.value = withTiming(1, { duration: 600 });
    } else {
      glowIntensity.value = withTiming(0, { duration: 600 });
    }
  }, [verified]);

  const animatedProps = useAnimatedProps(() => {
    const h = animatedHeight.value;
    const coilWidth = 9;
    const spacing = 18;

    let path = `M 12 0`;

    for (let y = 0; y < h; y += spacing) {
      path += `
        Q ${12 + coilWidth} ${y + spacing / 2},
          12 ${y + spacing}
      `;
    }

    return { d: path };
  });

  const animatedStroke = useAnimatedProps(() => {
    const color = interpolateColor(
      glowIntensity.value,
      [0, 1],
      ["#bbb", "#00f2ff"]
    );
    return { stroke: color };
  });

  return (
    <Svg
      width={28}
      height={height}
      style={{ position: "absolute", left: 4 }}
    >
      <Defs>
        <LinearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#f5f5f5" />
          <Stop offset="40%" stopColor="#bdbdbd" />
          <Stop offset="60%" stopColor="#9e9e9e" />
          <Stop offset="100%" stopColor="#f5f5f5" />
        </LinearGradient>

        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#00f2ff" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="#00f2ff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <AnimatedPath
        animatedProps={animatedProps}
        stroke="url(#metal)"
        strokeWidth={3}
        fill="none"
      />

      {verified && (
        <AnimatedPath
          animatedProps={animatedStroke}
          strokeWidth={6}
          fill="none"
          opacity={0.25}
        />
      )}
    </Svg>
  );
}
