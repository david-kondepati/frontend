"use client";

import { useState, useRef } from 'react';
import { Upload, Brush, Eraser, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import VideoCanvas, { VideoCanvasRef } from '@/components/VideoCanvas';

export default function VideoInpainter() {
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [hasMask, setHasMask] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<VideoCanvasRef>(null);

  const handleFileSelect = (file: File) => {
    if (file && (file.type.includes('video/mp4') || file.type.includes('video/webm') || file.type.includes('video/ogg'))) {
      const url = URL.createObjectURL(file);
      setUploadedVideo(url);
      setVideoFile(file);
      setShowSuccessMessage(true);
      
      // Auto-play video after a short delay to ensure it's loaded
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      }, 100);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveMask = () => {
    const maskData = canvasRef.current?.getMaskData();
    if (maskData) {
      // Create download link for mask
      const link = document.createElement('a');
      link.download = 'video-mask.png';
      link.href = maskData;
      link.click();
      console.log('Mask saved');
    }
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clearCanvas();
    setHasMask(false);
  };

  const handleInpaintVideo = () => {
    if (hasMask && prompt.trim()) {
      console.log('Inpaint video with prompt:', prompt);
      console.log('Mask data available:', !!canvasRef.current?.getMaskData());
      // Here you would typically send the video, mask, and prompt to your AI service
    }
  };

  const toggleDrawingMode = () => {
    setIsDrawingMode(!isDrawingMode);
    // Pause video when entering drawing mode
    if (!isDrawingMode && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleMaskChange = (hasContent: boolean) => {
    setHasMask(hasContent);
  };

  return (
    <div className="min-h-screen bg-slate-800 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Video Inpainter
          </h1>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 bg-green-500 text-white px-6 py-3 rounded-lg text-center font-medium animate-in slide-in-from-top duration-300">
            Video uploaded! Use the drawing tools to create a mask on the areas you want to edit.
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-slate-700/50 ${
              isDragOver ? 'border-blue-400 bg-slate-700/50 scale-105' : 'border-slate-600'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleUploadClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <p className="text-slate-300 text-lg">
              {uploadedVideo ? 'Click to upload a video' : 'Click to upload a video (MP4, WebM, OGG)'}
            </p>
          </div>
        </div>

        {/* Video Preview */}
        {uploadedVideo && (
          <div className="mb-8">
            <div className="bg-black rounded-lg overflow-hidden relative">
              <video
                ref={videoRef}
                src={uploadedVideo}
                controls
                className="w-full h-auto max-h-96 relative z-0"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              <VideoCanvas
                ref={canvasRef}
                videoRef={videoRef}
                isDrawing={isDrawingMode}
                brushSize={brushSize}
                onMaskChange={handleMaskChange}
              />
              {isDrawingMode && (
                <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm z-20">
                  Drawing Mode Active - Click and drag to draw mask
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons and Controls */}
        {uploadedVideo && (
          <div className="space-y-6">
            {/* Drawing Controls */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Drawing Tools</h3>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button
                  onClick={toggleDrawingMode}
                  className={`flex items-center gap-2 ${
                    isDrawingMode 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white transition-colors duration-200`}
                >
                  <Brush className="w-4 h-4" />
                  {isDrawingMode ? 'Exit Drawing' : 'Start Drawing'}
                </Button>
                
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm text-slate-300 whitespace-nowrap">Brush Size:</span>
                  <Slider
                    value={[brushSize]}
                    onValueChange={(value) => setBrushSize(value[0])}
                    max={50}
                    min={5}
                    step={5}
                    className="flex-1 max-w-32"
                  />
                  <span className="text-sm text-slate-300 w-8">{brushSize}px</span>
                </div>
              </div>
              
              {hasMask && (
                <div className="mt-4 p-3 bg-green-900/30 border border-green-600/50 rounded-lg">
                  <p className="text-green-300 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    Mask created! You can now add a prompt and process the video.
                  </p>
                </div>
              )}
            </div>
            {/* Save and Clear Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleSaveMask}
                disabled={!hasMask}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 text-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save Mask
              </Button>
              <Button
                onClick={handleClearCanvas}
                disabled={!hasMask}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 text-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Canvas
              </Button>
            </div>

            {/* Prompt Input */}
            <div>
              <Input
                type="text"
                placeholder="Prompt (e.g., a green tree)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400 py-3 text-lg rounded-lg focus:border-blue-400 focus:ring-blue-400"
              />
            </div>

            {/* Inpaint Button */}
            <div>
              <Button
                onClick={handleInpaintVideo}
                disabled={!prompt.trim() || !hasMask}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white py-3 text-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                Inpaint Video
              </Button>
              {(!hasMask || !prompt.trim()) && (
                <p className="text-slate-400 text-sm mt-2 text-center">
                  {!hasMask && !prompt.trim() 
                    ? 'Draw a mask and enter a prompt to continue'
                    : !hasMask 
                    ? 'Draw a mask on the video to continue'
                    : 'Enter a prompt to continue'
                  }
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}