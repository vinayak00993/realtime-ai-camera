export interface AnalysisResult {
  analysis: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface FrameData {
  base64: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface SamplerConfig {
  diffThreshold: number;
  minInterval: number;
  maxInterval: number;
  checkInterval: number;
  sendWidth: number;
  sendHeight: number;
  jpegQuality: number;
}

export const DEFAULT_SAMPLER_CONFIG: SamplerConfig = {
  diffThreshold: 0.25,
  minInterval: 5000,
  maxInterval: 15000,
  checkInterval: 500,
  sendWidth: 640,
  sendHeight: 480,
  jpegQuality: 0.6,
};
