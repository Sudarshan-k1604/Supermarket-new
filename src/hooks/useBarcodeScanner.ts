import { useRef, useCallback, useEffect } from 'react';
import jsQR from 'jsqr';

export const useBarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  /**
   * Function to draw a line on the canvas. Helper for drawBox.
   */
  const drawLine = (ctx: CanvasRenderingContext2D, begin: { x: number; y: number }, end: { x: number; y: number }, color: string) => {
    ctx.beginPath();
    ctx.moveTo(begin.x, begin.y);
    ctx.lineTo(end.x, end.y);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  /**
   * Function to draw the bounding box around the detected code.
   */
  const drawBox = (ctx: CanvasRenderingContext2D, location: any) => {
    drawLine(ctx, location.topLeftCorner, location.topRightCorner, '#FF3B58');
    drawLine(ctx, location.topRightCorner, location.bottomRightCorner, '#FF3B58');
    drawLine(ctx, location.bottomRightCorner, location.bottomLeftCorner, '#FF3B58');
    drawLine(ctx, location.bottomLeftCorner, location.topLeftCorner, '#FF3B58');
  };

  /**
   * Stops the camera stream and scanning loop.
   */
  const stopScanning = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  /**
   * Starts the camera and begins scanning for barcodes.
   */
  const startScanning = useCallback(async (onScan: (code: string) => void) => {
    stopScanning(); // Ensure previous stream is stopped

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.play();
        streamRef.current = stream;

        const scanFrame = () => {
          if (videoRef.current && canvasRef.current && streamRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.height = video.videoHeight;
              canvas.width = video.videoWidth;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (code) {
                // VISUAL FEEDBACK: Draw the box around the detected code
                drawBox(ctx, code.location);
                // Stop the camera and process the result after a short delay
                setTimeout(() => {
                  onScan(code.data);
                  stopScanning();
                }, 100); // 100ms delay to ensure the user sees the box
                return; // Exit the loop
              }
            }
          }
          // If no code is found, continue the loop
          animationFrameId.current = requestAnimationFrame(scanFrame);
        };
        
        animationFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Could not access camera. Please grant permission.');
    }
  }, [stopScanning]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    videoRef,
    canvasRef,
    startScanning,
    stopScanning
  };
};