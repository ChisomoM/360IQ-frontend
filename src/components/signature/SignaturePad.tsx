import { useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser } from 'lucide-react';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getDataURL: () => string;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width = 500, height = 180 }, ref) => {
    const canvasRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      clear: () => canvasRef.current?.clear(),
      isEmpty: () => canvasRef.current?.isEmpty() ?? true,
      getDataURL: () => {
        const trimmed = canvasRef.current?.getTrimmedCanvas();
        return trimmed ? trimmed.toDataURL('image/png') : '';
      },
    }));

    return (
      <div className="space-y-2">
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden cursor-crosshair">
          <SignatureCanvas
            ref={canvasRef}
            penColor="#1e3c21"
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
