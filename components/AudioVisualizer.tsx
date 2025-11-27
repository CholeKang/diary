import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Initialize refs with null and update types to include null to satisfy TypeScript requirements
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isRecording || !canvasRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioCtx = audioContextRef.current;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyserRef.current = analyser;
    sourceRef.current = source;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color based on frequency
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#818cf8'); // Indigo 400
        gradient.addColorStop(1, '#c084fc'); // Purple 400

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      // Note: We don't close the AudioContext here to reuse it, 
      // or we can close it if we want to be strict about resources.
    };
  }, [stream, isRecording]);

  return (
    <div className="w-full h-24 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 backdrop-blur-sm">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={100} 
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;