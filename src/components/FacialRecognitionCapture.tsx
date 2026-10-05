import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  ScanFace,
  Trash2,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Download,
  Eye,
  X,
} from 'lucide-react';
import { CustomAttachmentFile } from '../types';

/**
 * Compresses an uploaded image or captured video frame into a clean, fast-syncing Data URL
 * suitable for storing in the real-time HOS|TED database and displaying across frontend & Admin Portal.
 */
export async function compressImageFileToDataUrl(
  file: File,
  maxDimension: number = 720,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || '');
      if (!file.type.startsWith('image/')) {
        resolve(resultStr);
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.naturalWidth || img.width || 600;
          let height = img.naturalHeight || img.height || 600;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
            return;
          }
          resolve(resultStr);
        } catch {
          resolve(resultStr);
        }
      };
      img.onerror = () => resolve(resultStr);
      img.src = resultStr;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a FileList into CustomAttachmentFile objects (supports images, PDFs, sketches, measurement charts)
 */
export async function processCustomAttachmentFiles(
  fileList: FileList | null,
  category: CustomAttachmentFile['category'] = 'style_reference'
): Promise<CustomAttachmentFile[]> {
  if (!fileList || fileList.length === 0) return [];
  const results: CustomAttachmentFile[] = [];
  for (let i = 0; i < Math.min(fileList.length, 6); i++) {
    const file = fileList[i];
    try {
      const dataUrl = file.type.startsWith('image/')
        ? await compressImageFileToDataUrl(file, 900, 0.84)
        : await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });
      if (dataUrl) {
        results.push({
          id: `ATT-${Date.now()}-${Math.floor(100 + Math.random() * 899)}-${i}`,
          name: file.name || `Attachment-${i + 1}`,
          fileType: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toLocaleString(),
          category,
        });
      }
    } catch {
      // skip invalid file
    }
  }
  return results;
}

interface FacialRecognitionCaptureProps {
  photoUrl?: string;
  onChangePhoto: (dataUrl: string) => void;
  label?: string;
  subtitle?: string;
  compact?: boolean;
}

export const FacialRecognitionCapture: React.FC<FacialRecognitionCaptureProps> = ({
  photoUrl = '',
  onChangePhoto,
  label = 'Facial Recognition & Identity Photo',
  subtitle = 'Capture a live camera selfie or upload a clear face photo for instant HOS|TED recognition on the storefront & Admin Portal.',
  compact = false,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startLiveCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 80);
    } catch {
      setCameraError(
        'Camera permission unavailable in this browser frame—please use "Upload Face Photo" to select or take a photo from your device.'
      );
    }
  };

  const captureLiveSelfie = () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setTimeout(() => {
      try {
        const video = videoRef.current!;
        const canvas = document.createElement('canvas');
        const size = 480;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vw = video.videoWidth || 480;
          const vh = video.videoHeight || 480;
          const minDim = Math.min(vw, vh);
          const sx = (vw - minDim) / 2;
          const sy = (vh - minDim) / 2;
          ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onChangePhoto(dataUrl);
        }
      } finally {
        setIsScanning(false);
        stopCamera();
      }
    }, 350);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const dataUrl = await compressImageFileToDataUrl(file, 520, 0.85);
      onChangePhoto(dataUrl);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`rounded-2xl bg-stone-950 border border-amber-500/35 ${
        compact ? 'p-3.5' : 'p-4'
      } space-y-3 text-xs`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <ScanFace className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{label}</span>
            {photoUrl && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-sans text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                <span>Facial ID Active</span>
              </span>
            )}
          </div>
          {!compact && <p className="text-[11px] text-stone-400 leading-relaxed">{subtitle}</p>}
        </div>

        {photoUrl && (
          <button
            type="button"
            onClick={() => onChangePhoto('')}
            className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 border border-stone-800 flex items-center gap-1 text-[11px]"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Enrolled Facial Photo Preview or Live Camera Feed */}
      {isCameraOpen ? (
        <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-400 max-w-xs mx-auto aspect-square flex flex-col items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {/* Biometric Face Alignment Oval */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-44 h-56 rounded-full border-2 border-dashed border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.45)]" />
          </div>
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={captureLiveSelfie}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1.5 shadow-lg"
            >
              <Camera className="w-4 h-4" />
              <span>{isScanning ? 'Scanning Face...' : 'Capture Face ID'}</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-2 rounded-xl bg-stone-900/90 text-stone-200 border border-stone-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-stone-900 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0">
            {photoUrl ? (
              <>
                <img
                  src={photoUrl}
                  alt="Enrolled Facial Recognition"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-emerald-950/90 text-emerald-300 text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                  Verified Face
                </div>
              </>
            ) : (
              <ScanFace className="w-9 h-9 text-stone-600" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={startLiveCamera}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold flex items-center gap-1.5 transition shadow"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{photoUrl ? 'Retake Live Face Scan' : 'Start Live Camera Scan'}</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-semibold cursor-pointer inline-flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5" />
              <span>{photoUrl ? 'Change Face Photo' : 'Upload Face Photo'}</span>
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px]">
          {cameraError}
        </div>
      )}
    </div>
  );
};

interface CustomFilesAttachmentBoxProps {
  attachments: CustomAttachmentFile[];
  onChangeAttachments: (next: CustomAttachmentFile[]) => void;
  title?: string;
  description?: string;
}

export const CustomFilesAttachmentBox: React.FC<CustomFilesAttachmentBoxProps> = ({
  attachments,
  onChangeAttachments,
  title = 'Attach Custom Bespoke Style & Measurement Files',
  description = 'Upload outfit inspiration photos, fabric references, sketches, or measurement charts/PDFs. These files sync immediately to the HOS|TED Admin Portal.',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<CustomAttachmentFile | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const processed = await processCustomAttachmentFiles(files, 'style_reference');
      onChangeAttachments([...attachments, ...processed].slice(0, 8));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (id: string) => {
    onChangeAttachments(attachments.filter((item) => item.id !== id));
  };

  return (
    <div className="rounded-2xl bg-stone-950 border border-stone-800 p-4 space-y-3 text-xs">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
            <Paperclip className="w-3.5 h-3.5" />
            <span>{title}</span>
            {attachments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {attachments.length} file(s) attached
              </span>
            )}
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">{description}</p>
        </div>

        <label className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold cursor-pointer inline-flex items-center gap-1.5 transition shrink-0 shadow">
          {isUploading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Attaching...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Attach Files / Photos</span>
            </>
          )}
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFilesSelected}
            className="hidden"
          />
        </label>
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {attachments.map((att) => {
            const isImg = att.fileType.startsWith('image/') || att.dataUrl.startsWith('data:image/');
            return (
              <div
                key={att.id}
                className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImg ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="w-12 h-12 rounded-lg object-cover border border-amber-500/40 shrink-0 cursor-pointer"
                      onClick={() => setPreviewAttachment(att)}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-white font-semibold truncate text-xs">{att.name}</div>
                    <div className="text-[10px] text-stone-400">{att.uploadedAt}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isImg && (
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="p-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-amber-300 border border-stone-800"
                      title="Preview attached file"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <a
                    href={att.dataUrl}
                    download={att.name}
                    className="p-1.5 rounded-lg bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800"
                    title="Download file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(att.id)}
                    className="p-1.5 rounded-lg bg-stone-950 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-800"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-amber-500/40 rounded-3xl max-w-xl w-full p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif font-bold text-white text-sm truncate">
                {previewAttachment.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 rounded-lg bg-stone-900 text-stone-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewAttachment.dataUrl}
              alt={previewAttachment.name}
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-stone-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
