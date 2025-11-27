import React, { useState, useRef, useCallback } from 'react';
import { RecorderState } from '../types';
import AudioVisualizer from './AudioVisualizer';

interface RecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onImageSelected: (file: File) => void;
  onTextSubmit: (text: string) => void;
  state: RecorderState;
  setState: (state: RecorderState) => void;
}

const Recorder: React.FC<RecorderProps> = ({ onRecordingComplete, onImageSelected, onTextSubmit, state, setState }) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [streamForVisualizer, setStreamForVisualizer] = useState<MediaStream | null>(null);

  // Text Input State
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState("");

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStreamForVisualizer(stream);

      // Determine supported mime type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm; codecs=opus')) {
        mimeType = 'audio/webm; codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecordingComplete(blob);
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setStreamForVisualizer(null);
      };

      recorder.start();
      setState(RecorderState.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setState(RecorderState.ERROR);
    }
  }, [onRecordingComplete, setState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState(RecorderState.PROCESSING);
    }
  }, [setState]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelected(file);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextSave = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput);
    }
    setTextInput("");
    setIsTextModalOpen(false);
  };

  const mainButtonClass = "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95";
  const sideButtonClass = "w-12 h-12 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all shadow-lg";

  return (
    <>
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-slate-950 via-slate-900 to-transparent z-10 flex flex-col items-center">
        
        {/* Visualizer Area */}
        <div className="w-full max-w-md mb-6 transition-all duration-500 ease-in-out" 
            style={{ opacity: state === RecorderState.RECORDING ? 1 : 0, height: state === RecorderState.RECORDING ? 'auto' : 0 }}>
          {state === RecorderState.RECORDING && (
              <div className="mb-4">
                <p className="text-center text-indigo-400 text-sm font-medium mb-2 animate-pulse">Listening...</p>
                <AudioVisualizer stream={streamForVisualizer} isRecording={state === RecorderState.RECORDING} />
              </div>
          )}
        </div>

        {/* Controls Container */}
        <div className="relative flex items-center justify-center gap-8">
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Glow effect for recording */}
          {state === RecorderState.RECORDING && (
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-20 bg-red-500 rounded-full animate-ping opacity-25 pointer-events-none"></div>
          )}

          {/* Left: Image Button */}
          {state === RecorderState.IDLE && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={sideButtonClass}
              title="Upload Image / Scan Handwriting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* Center: Main Recording Button */}
          {state === RecorderState.IDLE || state === RecorderState.ERROR ? (
            <button 
              onClick={startRecording}
              className={`${mainButtonClass} bg-indigo-600 hover:bg-indigo-500 text-white z-10`}
              aria-label="Start Recording"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          ) : state === RecorderState.RECORDING ? (
            <button 
              onClick={stopRecording}
              className={`${mainButtonClass} bg-red-600 hover:bg-red-500 text-white z-10`}
              aria-label="Stop Recording"
            >
              <div className="w-8 h-8 bg-white rounded-md"></div>
            </button>
          ) : (
            <button 
              disabled
              className={`${mainButtonClass} bg-slate-700 text-slate-400 cursor-not-allowed z-10`}
            >
              <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </button>
          )}

          {/* Right: Text Button */}
          {state === RecorderState.IDLE && (
            <button
              onClick={() => setIsTextModalOpen(true)}
              className={sideButtonClass}
              title="Write Text Entry"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
        
        <p className="mt-4 text-slate-500 text-sm font-medium">
          {state === RecorderState.IDLE && "Select: Image • Voice • Text"}
          {state === RecorderState.RECORDING && "Tap to stop"}
          {state === RecorderState.PROCESSING && "Processing..."}
          {state === RecorderState.ERROR && "Microphone access denied"}
        </p>
      </div>

      {/* Text Entry Modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-100">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-white font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                New Diary Entry
              </h3>
              <button 
                onClick={() => setIsTextModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                placeholder="Write your thoughts here..."
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsTextModalOpen(false)} 
                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleTextSave} 
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Recorder;