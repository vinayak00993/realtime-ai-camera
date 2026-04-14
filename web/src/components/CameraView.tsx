"use client";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isReady: boolean;
  error: string | null;
  facingMode: "environment" | "user";
}

export function CameraView({
  videoRef,
  isReady,
  error,
  facingMode,
}: CameraViewProps) {
  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${
          facingMode === "user" ? "scale-x-[-1]" : ""
        }`}
      />

      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <div className="mb-4 h-8 w-8 mx-auto animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
          <div className="text-center text-white max-w-sm">
            <div className="mb-3 text-4xl">📷</div>
            <p className="text-lg font-medium mb-2">Camera Access Needed</p>
            <p className="text-sm text-white/70">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
