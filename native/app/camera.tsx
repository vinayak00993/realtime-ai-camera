import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";
import { analyzeFrame, askClaude } from "../lib/api";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Analysis {
  analysis: string;
  timestamp: number;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");

  // Analysis state
  const [observation, setObservation] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const recentTextsRef = useRef<string[]>([]);
  const isAnalyzingRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const spokenCharsRef = useRef(0);
  const lastSpokenIdRef = useRef<string | null>(null);

  // Frame sampling
  const samplerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keyboard height for lifting controls above keyboard
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Capture and analyze frames
  const captureAndAnalyze = useCallback(async () => {
    if (!cameraRef.current || isAnalyzingRef.current) return;
    isAnalyzingRef.current = true;
    setIsAnalyzing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4,
        skipProcessing: true,
      });

      if (!photo?.base64) return;

      const result = await analyzeFrame(photo.base64, recentTextsRef.current);
      recentTextsRef.current = [
        ...recentTextsRef.current.slice(-4),
        result.analysis,
      ];

      // Smooth fade transition
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setObservation(result.analysis);
        setRecentAnalyses((prev) => [...prev.slice(-9), result]);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    } catch (err) {
      // Silent fail — will retry on next interval
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [fadeAnim]);

  // Start frame sampling when camera is ready
  useEffect(() => {
    if (!permission?.granted) return;

    // Initial capture after a short delay
    const initialTimeout = setTimeout(() => captureAndAnalyze(), 2000);

    // Then every 8 seconds
    samplerRef.current = setInterval(() => {
      captureAndAnalyze();
    }, 8000);

    return () => {
      clearTimeout(initialTimeout);
      if (samplerRef.current) clearInterval(samplerRef.current);
    };
  }, [permission?.granted, captureAndAnalyze]);

  // Send a question
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    // Capture current frame
    let imageBase64: string | null = null;
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.5,
      });
      imageBase64 = photo?.base64 ?? null;
    } catch {}

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMsg = {
      id: assistantId,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    spokenCharsRef.current = 0;
    lastSpokenIdRef.current = assistantId;

    try {
      await askClaude(
        text,
        imageBase64,
        recentAnalyses,
        messages.map((m) => ({ role: m.role, content: m.content })),
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        },
        () => setIsStreaming(false)
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Sorry, something went wrong." }
            : m
        )
      );
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, recentAnalyses]);

  // TTS: speak the full message once streaming completes
  useEffect(() => {
    if (!voiceEnabled || isStreaming || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== "assistant" || !last.content) return;
    if (last.id === lastSpokenIdRef.current) return;

    lastSpokenIdRef.current = last.id;
    Speech.stop();
    Speech.speak(last.content, {
      language: "en-US",
      rate: 1.0,
      pitch: 1.0,
    });
  }, [messages, isStreaming, voiceEnabled]);

  // Auto-scroll chat
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // Permission screen
  if (!permission) return <View style={s.permScreen} />;
  if (!permission.granted) {
    return (
      <View style={s.permScreen}>
        <Ionicons name="camera" size={48} color="rgba(255,255,255,0.5)" />
        <Text style={s.permTitle}>Camera Access Needed</Text>
        <Text style={s.permDesc}>
          LiveLens needs your camera to see what you're working on.
        </Text>
        <Pressable onPress={requestPermission} style={s.permBtn}>
          <Text style={s.permBtnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={s.camera} facing={facing} />

      {/* Observation banner */}
      <View style={s.banner}>
        <View style={s.statusDot}>
          <View
            style={[s.dot, { backgroundColor: isAnalyzing ? "#facc15" : "#4ade80" }]}
          />
          <Text style={s.statusText}>
            {isAnalyzing ? "Looking..." : "Live"}
          </Text>
        </View>
        {observation ? (
          <Animated.Text style={[s.observation, { opacity: fadeAnim }]}>
            {observation}
          </Animated.Text>
        ) : null}
      </View>

      {/* Chat panel */}
      {messages.length > 0 && (
        <View style={[s.chatContainer, { bottom: 140 + keyboardHeight }]}>
          <ScrollView
            ref={scrollRef}
            style={s.chatScroll}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  s.bubble,
                  msg.role === "user" ? s.bubbleUser : s.bubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    s.bubbleText,
                    msg.role === "user" && s.bubbleTextUser,
                  ]}
                >
                  {msg.content || "..."}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Controls */}
      <View style={[s.controls, { bottom: keyboardHeight }]}>
        <View style={s.controlsTop}>
          <Pressable
            onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
            style={s.smallBtn}
          >
            <Ionicons name="camera-reverse" size={16} color="#fff" />
            <Text style={s.smallBtnText}>Flip</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (voiceEnabled) {
                Speech.stop();
                setVoiceEnabled(false);
              } else {
                setVoiceEnabled(true);
                // Test speech to verify TTS works + warm up on iOS
                Speech.speak("Voice enabled", {
                  language: "en-US",
                  rate: 1.0,
                  pitch: 1.0,
                });
              }
            }}
            style={[s.smallBtn, voiceEnabled && s.smallBtnActive]}
          >
            <Ionicons
              name={voiceEnabled ? "volume-high" : "volume-mute"}
              size={16}
              color="#fff"
            />
            <Text style={s.smallBtnText}>
              {voiceEnabled ? "Voice on" : "Voice off"}
            </Text>
          </Pressable>
        </View>

        <View style={s.inputRow}>
          <View style={s.inputWrapper}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask anything..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isStreaming}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || isStreaming}
            style={[s.sendBtn, (!input.trim() || isStreaming) && s.sendBtnDisabled]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { ...StyleSheet.absoluteFillObject },

  // Permission
  permScreen: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
  },
  permDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  permBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
  },
  permBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },

  // Banner
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
    // Gradient effect via background
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  statusDot: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  observation: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    lineHeight: 20,
  },

  // Chat
  chatContainer: {
    position: "absolute",
    bottom: 140,
    left: 8,
    right: 8,
    maxHeight: "40%",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    overflow: "hidden",
  },
  chatScroll: { padding: 12 },
  bubble: { maxWidth: "85%", borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleUser: {
    backgroundColor: "#3b82f6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: "#fff", lineHeight: 20 },
  bubbleTextUser: {},

  // Controls
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 34,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  controlsTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  smallBtnActive: { backgroundColor: "#3b82f6" },
  smallBtnText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inputWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
  },
  input: { height: 44, color: "#fff", fontSize: 14 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
