import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, Download, MicOff, Volume2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// Module-level reference to ensure only ONE audio plays across the entire dashboard
let globalActiveAudio = null;
let globalStopCallback = null;

export default function CallAudioPlayer({ log, clinicId }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number(log?.duration_seconds || 0));
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef(null);

  const durationSec = Number(log?.duration_seconds || 0);
  const status = String(log?.call_status || '').toUpperCase();
  const isMissedOrBusy = durationSec <= 5 || status.includes('CANCEL') || status.includes('BUSY') || status.includes('NO_ANSWER');

  // Format mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePlayToggle = async () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    // Stop any other currently playing audio on the page
    if (globalActiveAudio && globalActiveAudio !== audioRef.current) {
      try {
        globalActiveAudio.pause();
        if (globalStopCallback) globalStopCallback();
      } catch (e) {}
    }

    // Fetch presigned / streaming playback URL if not yet fetched
    let urlToPlay = playbackUrl;
    if (!urlToPlay) {
      setIsLoading(true);
      setHasError(false);
      try {
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
        const res = await fetch(`${apiBase}/api/clinics/${clinicId}/calls/${log.call_sid}/recording`);
        const data = await res.json();

        if (data.success && data.playback_url) {
          urlToPlay = data.playback_url;
          setPlaybackUrl(urlToPlay);
        } else {
          // If direct URL is saved in call log
          urlToPlay = log.recording_url || `${apiBase}/api/recordings/${clinicId}/${log.call_sid}.mp3`;
          setPlaybackUrl(urlToPlay);
        }
      } catch (err) {
        urlToPlay = log.recording_url || `/api/recordings/${clinicId}/${log.call_sid}.mp3`;
        setPlaybackUrl(urlToPlay);
      } finally {
        setIsLoading(false);
      }
    }

    if (!urlToPlay) {
      toast.error('No audio recording URL available for this call.');
      setHasError(true);
      return;
    }

    // Create or play audio element
    if (!audioRef.current) {
      const audio = new Audio(urlToPlay);
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', () => {
        setIsLoading(false);
        setIsPlaying(false);
        setHasError(true);
        toast.error('Audio recording is processing or AWS S3 credentials are in demo mode.', {
          icon: '🎙️',
          duration: 4000
        });
      });
    }

    try {
      setIsLoading(true);
      globalActiveAudio = audioRef.current;
      globalStopCallback = () => setIsPlaying(false);

      await audioRef.current.play();
      setIsPlaying(true);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setIsPlaying(false);
      setHasError(true);
      toast.error('Could not stream audio. Verify AWS S3 bucket permissions.', { duration: 3500 });
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // If call was too short or unanswered, show subtle muted indicator
  if (isMissedOrBusy) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-500 border border-slate-200/80 text-[11px] font-medium" title="No audio recorded for short/unanswered call">
        <MicOff className="w-3 h-3 text-slate-400" />
        <span>No Audio</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg bg-slate-50 border border-slate-200/80 shadow-xs max-w-[210px] select-none">
      {/* Play / Pause Pill Button */}
      <button
        type="button"
        onClick={handlePlayToggle}
        disabled={isLoading}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs cursor-pointer ${
          isPlaying
            ? 'bg-blue-700 hover:bg-blue-800 text-white'
            : hasError
              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isPlaying ? 'Pause conversation' : 'Play call recording'}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : hasError ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Track & Time */}
      <div className="flex-1 flex items-center gap-2 min-w-0 text-[10px] font-mono font-medium text-slate-600 tabular-nums">
        <span className="shrink-0">{formatTime(currentTime)}</span>

        {/* Progress Slider: played portion filled in blue, thumb only on hover */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{
            background: `linear-gradient(to right, #2563EB ${Math.min(100, (currentTime / (duration || 1)) * 100)}%, #E2E8F0 0)`,
          }}
          className="flex-1 min-w-0 h-1 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:opacity-0 hover:[&::-webkit-slider-thumb]:opacity-100 focus-visible:[&::-webkit-slider-thumb]:opacity-100
            [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:opacity-0 hover:[&::-moz-range-thumb]:opacity-100"
        />

        <span className="shrink-0">{formatTime(duration)}</span>
      </div>

      {/* Download Action (if URL is resolved) */}
      {playbackUrl && !hasError && (
        <a
          href={playbackUrl}
          download={`call-${log.call_sid}.mp3`}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          title="Download MP3"
        >
          <Download className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
