import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  isRecording: boolean;
  isPlaying: boolean;
  audioStream?: MediaStream | null;
}

const Waveform: React.FC<WaveformProps> = ({ isRecording, isPlaying, audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (isRecording && audioStream && !audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(audioStream);
      
      analyser.fftSize = 64; // Fewer bars for cleaner look
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioContextRef.current = ctx;
    } else if (!isRecording && audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);
      
      const barCount = 12;
      const gap = 4;
      const totalGap = gap * (barCount - 1);
      const barWidth = (width - totalGap) / barCount;
      
      let x = 0;
      const data = dataArrayRef.current;
      
      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;

        if (isRecording && analyserRef.current && data) {
           analyserRef.current.getByteFrequencyData(data);
           const index = Math.floor(i * (data.length / barCount));
           const value = data[index];
           barHeight = (value / 255) * height;
        } else if (isPlaying) {
           // Smoother simulated animation
           const time = Date.now() / 200;
           const noise = Math.sin(time + i);
           barHeight = (Math.abs(noise) * height * 0.6) + 5;
        }

        // Rounded caps look
        barHeight = Math.max(4, barHeight);
        
        // Color logic
        if (isRecording) {
            ctx.fillStyle = '#FF4D4F'; // Error Red for recording
        } else if (isPlaying) {
            ctx.fillStyle = '#0084FF'; // Brand Blue
        } else {
            ctx.fillStyle = '#E0E0E0'; // Idle
        }
        
        const y = (height - barHeight) / 2;
        
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 50); // Fully rounded
        ctx.fill();

        x += barWidth + gap;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, isPlaying, audioStream]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={30} 
      className="w-[120px] h-[30px]"
    />
  );
};

export default Waveform;