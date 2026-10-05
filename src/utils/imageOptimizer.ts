/**
 * Client-Side Media Optimizer
 * Automatically resizes and compresses user-uploaded images to modern high-performance WebP/JPEG formats
 * to ensure lightning-fast storefront loading and minimal bandwidth/storage usage.
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export interface OptimizationResult {
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number; // e.g. 75% saved
  width: number;
  height: number;
}

/**
 * Optimizes an uploaded File or Blob before saving to storage or server.
 */
export async function optimizeUploadedImage(
  file: File | Blob,
  options: OptimizeOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.82,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read uploaded image file.'));
    reader.onload = (loadEvent) => {
      const srcUrl = loadEvent.target?.result as string;
      if (!srcUrl) {
        reject(new Error('Empty image payload.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Image decode error.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional scale down if image exceeds max bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          // Fallback to original if canvas 2D context unavailable
          resolve({
            dataUrl: srcUrl,
            blob: file,
            originalSize,
            optimizedSize: originalSize,
            compressionRatio: 0,
            width: img.width,
            height: img.height,
          });
          return;
        }

        // Apply high-quality bicubic resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw scaled image
        ctx.drawImage(img, 0, 0, width, height);

        // Check if browser supports WebP canvas export
        let targetFormat = format;
        let dataUrl = canvas.toDataURL(targetFormat, quality);

        // Fallback to JPEG if WebP produced larger or unsupported
        if (!dataUrl.startsWith('data:image/webp') && format === 'image/webp') {
          targetFormat = 'image/jpeg';
          dataUrl = canvas.toDataURL(targetFormat, quality);
        }

        canvas.toBlob(
          (blob) => {
            const finalBlob = blob || file;
            const optimizedSize = finalBlob.size;
            const savedBytes = Math.max(0, originalSize - optimizedSize);
            const compressionRatio = Math.round((savedBytes / originalSize) * 100);

            resolve({
              dataUrl,
              blob: finalBlob,
              originalSize,
              optimizedSize,
              compressionRatio,
              width,
              height,
            });
          },
          targetFormat,
          quality
        );
      };

      img.src = srcUrl;
    };

    reader.readAsDataURL(file);
  });
}
