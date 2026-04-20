import { useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getDataURL: () => string;
  loadDataURL: (dataUrl: string) => void;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
}

function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  let top = 0, bottom = height - 1, left = 0, right = width - 1;

  outTop: for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (imageData[(y * width + x) * 4 + 3] !== 0) {
        top = y;
        break outTop;
      }
    }
  }

  outBottom: for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (imageData[(y * width + x) * 4 + 3] !== 0) {
        bottom = y;
        break outBottom;
      }
    }
  }

  outLeft: for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (imageData[(y * width + x) * 4 + 3] !== 0) {
        left = x;
        break outLeft;
      }
    }
  }

  outRight: for (let x = width - 1; x >= 0; x--) {
    for (let y = 0; y < height; y++) {
      if (imageData[(y * width + x) * 4 + 3] !== 0) {
        right = x;
        break outRight;
      }
    }
  }

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;

  if (trimmedWidth <= 0 || trimmedHeight <= 0) return canvas;

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (trimmedCtx) {
    trimmedCtx.putImageData(ctx.getImageData(left, top, trimmedWidth, trimmedHeight), 0, 0);
  }

  return trimmedCanvas;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width = 500, height = 180 }, ref) => {
    const canvasRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      clear: () => canvasRef.current?.clear(),
      isEmpty: () => canvasRef.current?.isEmpty() ?? true,
      loadDataURL: (dataUrl: string) => {
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) return;
        // Clear via the component (resets internal stroke data)
        canvasRef.current?.clear();
        // Bypass fromDataURL which has a known DPR bug on retina displays.
        // Draw directly on the 2D context, centered and scaled to fit.
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.85;
          const x = (canvas.width - img.width * scale) / 2;
          const y = (canvas.height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = dataUrl;
      },
      getDataURL: () => {
        const rawCanvas = canvasRef.current?.getCanvas();
        if (!rawCanvas) return '';
        const trimmed = trimCanvas(rawCanvas);
        // Adding a little padding around the signature for a cleaner look
        const paddedCanvas = document.createElement('canvas');
        const padCtx = paddedCanvas.getContext('2d');
        const padding = 10;
        paddedCanvas.width = trimmed.width + padding * 2;
        paddedCanvas.height = trimmed.height + padding * 2;
        if (padCtx) {
          padCtx.drawImage(trimmed, padding, padding);
        }
        return paddedCanvas.toDataURL('image/png');
      },
    }));

    return (
      <div className="space-y-2">
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden cursor-crosshair">
          <SignatureCanvas
            ref={canvasRef}
            penColor="#000000"
            dotSize={2}
            minWidth={1}
            maxWidth={2}
            velocityFilterWeight={1.5}
            canvasProps={{
              width,
              height,
              className: 'block w-full',
              style: { touchAction: 'none' },
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Draw your signature above</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => canvasRef.current?.clear()}
            className="text-gray-500 h-7 px-2"
          >
            <Eraser className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
export default SignaturePad;
