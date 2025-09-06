"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isDrawing: boolean;
  brushSize: number;
  onMaskChange?: (hasContent: boolean) => void;
}

export interface VideoCanvasRef {
  clearCanvas: () => void;
  getMaskData: () => string | null;
}

const VideoCanvas = forwardRef<VideoCanvasRef, VideoCanvasProps>(
  ({ videoRef, isDrawing, brushSize, onMaskChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawingActive, setIsDrawingActive] = useState(false);
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            onMaskChange?.(false);
          }
        }
      },
      getMaskData: () => {
        const canvas = canvasRef.current;
        if (canvas) {
          return canvas.toDataURL();
        }
        return null;
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      if (canvas && video) {
        const resizeCanvas = () => {
          const rect = video.getBoundingClientRect();
          canvas.width = video.videoWidth || rect.width;
          canvas.height = video.videoHeight || rect.height;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
        };

        const handleVideoLoad = () => {
          resizeCanvas();
        };

        video.addEventListener('loadedmetadata', handleVideoLoad);
        window.addEventListener('resize', resizeCanvas);

        // Initial resize
        if (video.videoWidth > 0) {
          resizeCanvas();
        }

        return () => {
          video.removeEventListener('loadedmetadata', handleVideoLoad);
          window.removeEventListener('resize', resizeCanvas);
        };
      }
    }, [videoRef]);

    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const drawLine = (ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      
      const point = getCanvasPoint(e);
      if (point) {
        setIsDrawingActive(true);
        setLastPoint(point);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
          // Draw a dot for single clicks
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
          ctx.fill();
          onMaskChange?.(true);
        }
      }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !isDrawingActive || !lastPoint) return;
      
      const point = getCanvasPoint(e);
      if (point) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
          drawLine(ctx, lastPoint, point);
          setLastPoint(point);
          onMaskChange?.(true);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDrawingActive(false);
      setLastPoint(null);
    };

    const handleMouseLeave = () => {
      setIsDrawingActive(false);
      setLastPoint(null);
    };

    return (
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full pointer-events-auto ${
          isDrawing ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ zIndex: isDrawing ? 10 : -1 }}
      />
    );
  }
);

VideoCanvas.displayName = 'VideoCanvas';

export default VideoCanvas;