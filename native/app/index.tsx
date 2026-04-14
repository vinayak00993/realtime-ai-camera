import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

const FEATURES = [
  {
    icon: "camera" as const,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.15)",
    title: "Real-time Vision",
    desc: "AI sees what you see through your camera",
  },
  {
    icon: "mic" as const,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.15)",
    title: "Voice Interaction",
    desc: "Ask questions hands-free while you work",
  },
  {
    icon: "volume-high" as const,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.15)",
    title: "Spoken Guidance",
    desc: "Hear step-by-step help while cooking, building, or fixing",
  },
];

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(FEATURES.map(() => new Animated.Value(30))).current;
  const slideOpacities = useRef(
    FEATURES.map(() => new Animated.Value(0))
  ).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Slide in feature cards
    FEATURES.forEach((_, i) => {
      Animated.parallel([
        Animated.timing(slideAnims[i], {
          toValue: 0,
          duration: 500,
          delay: 300 + i * 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideOpacities[i], {
          toValue: 1,
          duration: 500,
          delay: 300 + i * 150,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Fade in button
    Animated.timing(btnAnim, {
      toValue: 1,
      duration: 600,
      delay: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient colors={["#0a0a1a", "#111827", "#000"]} style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + Title */}
        <Animated.View style={[s.header, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={["#3b82f6", "#8b5cf6"]}
            style={s.logoBox}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sunny" size={40} color="#fff" />
          </LinearGradient>
          <Text style={s.title}>
            Live<Text style={s.titleAccent}>Lens</Text>
          </Text>
          <Text style={s.tagline}>
            Your AI-powered companion for everyday tasks. Point your camera, get
            instant guidance.
          </Text>
        </Animated.View>

        {/* Feature cards */}
        <View style={s.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.title}
              style={[
                s.card,
                {
                  opacity: slideOpacities[i],
                  transform: [{ translateY: slideAnims[i] }],
                },
              ]}
            >
              <View style={[s.iconBox, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={24} color={f.color} />
              </View>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>{f.title}</Text>
                <Text style={s.cardDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* CTA */}
        <Animated.View style={{ opacity: btnAnim }}>
          <Pressable
            onPress={() => router.push("/camera")}
            style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          >
            <LinearGradient
              colors={["#3b82f6", "#8b5cf6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaGradient}
            >
              <Text style={s.ctaText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <Text style={s.footer}>Created by Vinayak Rao</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontSize: 44, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  titleAccent: { color: "#60a5fa" },
  tagline: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
    maxWidth: 300,
  },
  features: { width: "100%", gap: 12, marginBottom: 32 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  cardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
  },
  cta: { borderRadius: 50, overflow: "hidden" },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
  },
  ctaText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  footer: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    marginTop: 32,
  },
});
