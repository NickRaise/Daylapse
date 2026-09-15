import { useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesomeFreeSolid from "@react-native-vector-icons/fontawesome-free-solid";
import { fontSize, makeStyles, radius, spacing, useColors } from "@/theme";
import { ONBOARDING_SLIDES } from "@/data/onboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function OnboardingTour({ visible, onDone }: Props) {
  const s = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === ONBOARDING_SLIDES.length - 1;

  function goTo(next: number) {
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setIndex(next);
  }

  function handleMomentumEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
  }

  function handleDone() {
    setIndex(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    onDone();
  }

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={handleDone}>
      <View style={s.root}>
        {!isLast && (
          <Pressable style={[s.skip, { top: insets.top + spacing[3] }]} onPress={handleDone} hitSlop={10}>
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        )}

        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
        >
          {ONBOARDING_SLIDES.map((slide) => (
            <View key={slide.key} style={[s.slide, { width: SCREEN_WIDTH }]}>
              <View style={s.iconWrap}>
                {slide.useLogo ? (
                  <Image source={require("../../../assets/images/icon.png")} style={s.logo} />
                ) : (
                  <FontAwesomeFreeSolid name={slide.icon!} size={40} color={colors.primary} />
                )}
              </View>
              <Text style={s.title}>{slide.title}</Text>
              <Text style={s.body}>{slide.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + spacing[6] }]}>
          <View style={s.dots}>
            {ONBOARDING_SLIDES.map((slide, i) => (
              <View key={slide.key} style={[s.dot, i === index && s.dotActive]} />
            ))}
          </View>

          <Pressable style={s.nextBtn} onPress={() => (isLast ? handleDone() : goTo(index + 1))}>
            <Text style={s.nextBtnText}>{isLast ? "Start keeping your days" : "Next"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg },
  skip: {
    position: "absolute",
    right: spacing[5],
    zIndex: 1,
    padding: spacing[2],
  },
  skipText: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.textMuted,
  },
  scroll: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[8],
    gap: spacing[5],
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logo: { width: 84, height: 84, borderRadius: radius.lg },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: spacing[6],
    gap: spacing[5],
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  nextBtnText: {
    fontSize: fontSize.base,
    fontWeight: "700",
    color: colors.textOnAccent,
  },
}));
