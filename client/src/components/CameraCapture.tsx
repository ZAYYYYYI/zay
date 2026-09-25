import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, Loader2, Check } from "lucide-react";
import { Button } from "@client/src/components/ui/button";
import { Image } from '@client/src/components/ui/image';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled: boolean;
}

type FacingMode = "environment" | "user";

const CameraCapture = ({ onCapture, disabled }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "ready" | "captured">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setCameraState("starting");
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraState("ready");
    } catch {
      setError("无法访问摄像头，请检查权限设置");
      setCameraState("idle");
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  const handleToggleCamera = () => {
    const next: FacingMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setCameraState("idle");
    setPreviewUrl(null);
    stopStream();
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.85);
    setPreviewUrl(url);
    setCameraState("captured");
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `plant-${Date.now()}.jpg`, { type: "image/jpeg" });
          onCapture(file);
        }
      },
      "image/jpeg",
      0.85,
    );
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    setCameraState("idle");
  };

  const handleSubmitCapture = () => {
    if (previewUrl) {
      canvasRef.current?.toBlob(
        (blob) => {
          if (blob) {
            onCapture(new File([blob], `plant-${Date.now()}.jpg`, { type: "image/jpeg" }));
          }
        },
        "image/jpeg",
        0.85,
      );
    }
  };

  if (cameraState === "captured" && previewUrl) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-black">
          <Image src={previewUrl} alt="拍摄预览" className="w-full object-contain max-h-80" />
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleRetake} disabled={disabled}>
            <RefreshCw className="w-4 h-4 mr-1" />
            重拍
          </Button>
          <Button onClick={handleSubmitCapture} disabled={disabled}>
            <Check className="w-4 h-4 mr-1" />
            使用照片
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cameraState === "starting" && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-gray-500">正在启动摄像头...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={startCamera}>
            重试
          </Button>
        </div>
      )}

      <div className={cameraState === "ready" ? "" : "hidden"}>
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full object-contain max-h-80"
          />
        </div>
        <div className="flex gap-3 justify-center mt-4">
          <Button variant="outline" size="sm" onClick={handleToggleCamera} disabled={disabled}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {facingMode === "environment" ? "前置" : "后置"}摄像头
          </Button>
          <Button size="sm" onClick={handleCapture} disabled={disabled}>
            <Camera className="w-4 h-4 mr-1" />
            拍照
          </Button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraState === "idle" && !error && (
        <div className="flex flex-col items-center py-12 gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <Button onClick={startCamera} disabled={disabled} size="lg">
            <Camera className="w-4 h-4 mr-2" />
            打开{facingMode === "environment" ? "后置" : "前置"}摄像头
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleCamera}
              disabled={disabled}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              切换{facingMode === "environment" ? "前置" : "后置"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;