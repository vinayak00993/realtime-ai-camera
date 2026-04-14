/**
 * Capture a frame from a video element onto a canvas and return as base64 JPEG.
 */
export function captureFrame(
  video: HTMLVideoElement,
  width: number,
  height: number,
  quality: number
): string | null {
  if (video.readyState < 2) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  // Strip the data:image/jpeg;base64, prefix
  return dataUrl.split(",")[1];
}

/**
 * Compute a normalized diff score between two ImageData arrays.
 * Samples every 4th pixel for speed. Returns 0.0 (identical) to 1.0 (completely different).
 */
export function computeFrameDiff(
  current: ImageData,
  previous: ImageData
): number {
  const len = current.data.length;
  let diff = 0;
  let sampledPixels = 0;

  // Sample every 4th pixel (stride of 16 bytes since each pixel is 4 bytes RGBA)
  for (let i = 0; i < len; i += 16) {
    diff +=
      Math.abs(current.data[i] - previous.data[i]) +
      Math.abs(current.data[i + 1] - previous.data[i + 1]) +
      Math.abs(current.data[i + 2] - previous.data[i + 2]);
    sampledPixels++;
  }

  // Normalize: max diff per pixel is 255*3 = 765
  return diff / (sampledPixels * 765);
}

/**
 * Get ImageData from a video element at a small resolution for diffing.
 */
export function getSmallFrameData(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): ImageData | null {
  if (video.readyState < 2) return null;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
