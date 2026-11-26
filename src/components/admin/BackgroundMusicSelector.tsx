'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  Upload,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  FileAudio,
  Trash2,
  RefreshCw,
  Scissors,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  DEAR_YOU_MUSIC_LIBRARY,
  MUSIC_CATEGORIES,
  MusicTrack,
  MusicCategory,
  formatAudioSeconds,
  parseAudioSeconds,
  getMusicTrackById,
  DEFAULT_LIBRARY_TRACK,
} from '@/config/music-library';
import {
  MAX_AUDIO_FILE_SIZE_BYTES,
  MAX_AUDIO_DURATION_SECONDS,
  MIN_TRIM_DURATION_SECONDS,
  validateClientAudioFile,
  validatePlaybackTrim,
} from '@/lib/audio/audio-utils';
import { MusicSource } from '@/types/gift';

export interface BackgroundMusicSelectorProps {
  giftId?: string;
  musicSource: MusicSource;
  musicEnabled: boolean;
  libraryTrackId?: string;
  customAudioStoragePath?: string;
  customAudioFilename?: string;
  audioDuration?: number;
  playbackStartTime?: number;
  playbackEndTime?: number;
  loopEnabled?: boolean;
  musicUrl?: string;
  musicTitle?: string;
  onChange: (config: {
    music_enabled: boolean;
    music_source: MusicSource;
    library_track_id?: string;
    custom_audio_storage_path?: string;
    custom_audio_filename?: string;
    audio_duration?: number;
    playback_start_time?: number;
    playback_end_time?: number;
    loop_enabled: boolean;
    music_url?: string;
    music_title?: string;
  }) => void;
  onUploadStateChange?: (isUploading: boolean, hasUploadError: boolean) => void;
}

export function BackgroundMusicSelector({
  giftId,
  musicSource = 'library',
  musicEnabled = true,
  libraryTrackId = 'lib-gentle-moments',
  customAudioStoragePath,
  customAudioFilename,
  audioDuration,
  playbackStartTime = 0,
  playbackEndTime,
  loopEnabled = true,
  musicUrl,
  musicTitle,
  onChange,
  onUploadStateChange,
}: BackgroundMusicSelectorProps) {
  // Category filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Preview states (isolated to creator studio preview)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentlyPreviewingUrl, setCurrentlyPreviewingUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Optional Trimming states
  const [showTrimmingPanel, setShowTrimmingPanel] = useState(
    Boolean(playbackStartTime > 0 || (playbackEndTime && audioDuration && playbackEndTime < audioDuration))
  );
  const [trimStartFormatted, setTrimStartFormatted] = useState(formatAudioSeconds(playbackStartTime || 0));
  const [trimEndFormatted, setTrimEndFormatted] = useState(
    playbackEndTime ? formatAudioSeconds(playbackEndTime) : ''
  );
  const [trimError, setTrimError] = useState<string | null>(null);

  // Stop preview audio when unmounting or switching modes
  const stopPreviewAudio = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setIsPreviewPlaying(false);
    setCurrentlyPreviewingUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPreviewAudio();
    };
  }, [stopPreviewAudio]);

  // Handle Play/Pause Preview of any track URL
  const togglePlayPreview = (trackUrl: string, startSec = 0, endSec?: number) => {
    if (!trackUrl) return;

    if (currentlyPreviewingUrl === trackUrl && isPreviewPlaying) {
      // Pause
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPreviewPlaying(false);
    } else {
      // Cleanly stop any existing playing audio to avoid overlap or stale buffers
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current.ontimeupdate = null;
        previewAudioRef.current.onended = null;
      }

      // Create new Audio instance to guarantee fresh media loading without stale cached buffer
      const audio = new Audio(trackUrl);
      previewAudioRef.current = audio;
      audio.currentTime = startSec || 0;
      setCurrentlyPreviewingUrl(trackUrl);
      setIsPreviewPlaying(true);

      // Trimming listener for segment preview
      if (endSec && endSec > startSec) {
        audio.ontimeupdate = () => {
          if (audio.currentTime >= endSec) {
            audio.currentTime = startSec;
          }
        };
      } else {
        audio.ontimeupdate = null;
        audio.loop = true;
      }

      audio.onended = () => {
        setIsPreviewPlaying(false);
        setCurrentlyPreviewingUrl(null);
      };

      audio.play().catch((err) => {
        console.warn('Preview playback prevented:', err);
        setIsPreviewPlaying(false);
      });
    }
  };

  // Switch active choice (Library, Upload, None)
  const handleSourceSelect = (newSource: MusicSource) => {
    stopPreviewAudio();
    setUploadError(null);

    if (newSource === 'none') {
      onChange({
        music_enabled: false,
        music_source: 'none',
        library_track_id: undefined,
        custom_audio_storage_path: customAudioStoragePath,
        custom_audio_filename: customAudioFilename,
        audio_duration: undefined,
        playback_start_time: 0,
        playback_end_time: undefined,
        loop_enabled: false,
        music_url: undefined,
        music_title: undefined,
      });
      return;
    }

    if (newSource === 'library') {
      const activeLibId = libraryTrackId || DEFAULT_LIBRARY_TRACK.id;
      const track = getMusicTrackById(activeLibId) || DEFAULT_LIBRARY_TRACK;
      onChange({
        music_enabled: true,
        music_source: 'library',
        library_track_id: track.id,
        custom_audio_storage_path: customAudioStoragePath,
        custom_audio_filename: customAudioFilename,
        audio_duration: track.duration,
        playback_start_time: playbackStartTime || 0,
        playback_end_time: playbackEndTime,
        loop_enabled: loopEnabled ?? true,
        music_url: track.audio_url,
        music_title: track.title,
      });
      return;
    }

    if (newSource === 'upload') {
      onChange({
        music_enabled: Boolean(customAudioStoragePath || musicUrl),
        music_source: 'upload',
        library_track_id: libraryTrackId,
        custom_audio_storage_path: customAudioStoragePath,
        custom_audio_filename: customAudioFilename,
        audio_duration: audioDuration,
        playback_start_time: playbackStartTime || 0,
        playback_end_time: playbackEndTime,
        loop_enabled: loopEnabled ?? true,
        music_url: musicUrl,
        music_title: customAudioFilename || musicTitle || 'Personal Custom Audio',
      });
    }
  };

  // Select a track from the library
  const handleChooseLibraryTrack = (track: MusicTrack) => {
    if (currentlyPreviewingUrl && currentlyPreviewingUrl !== track.audio_url) {
      stopPreviewAudio();
    }
    onChange({
      music_enabled: true,
      music_source: 'library',
      library_track_id: track.id,
      custom_audio_storage_path: customAudioStoragePath,
      custom_audio_filename: customAudioFilename,
      audio_duration: track.duration,
      playback_start_time: playbackStartTime || 0,
      playback_end_time: playbackEndTime,
      loop_enabled: loopEnabled ?? true,
      music_url: track.audio_url,
      music_title: track.title,
    });
  };

  // Handle client-side file selection & upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Client-Side Size & Format Validation
    const validation = validateClientAudioFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid audio file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. Client-Side Duration Inspection via HTML5 Audio
    let detectedDuration = 180;
    try {
      const objectUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(objectUrl);
      await new Promise<void>((resolve, reject) => {
        tempAudio.onloadedmetadata = () => {
          detectedDuration = tempAudio.duration;
          URL.revokeObjectURL(objectUrl);
          resolve();
        };
        tempAudio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(); // proceed to server validation if browser parser struggles
        };
      });

      if (detectedDuration > MAX_AUDIO_DURATION_SECONDS + 2) {
        setUploadError(
          `Audio duration (${Math.floor(detectedDuration / 60)}m ${Math.floor(detectedDuration % 60)}s) exceeds the maximum allowed limit of 5 minutes.`
        );
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch {
      // Proceed to server verification
    }

    // 3. Perform Server Upload
    setIsUploading(true);
    setUploadProgress(20);
    if (onUploadStateChange) onUploadStateChange(true, false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('giftId', giftId || '');
    formData.append('duration', detectedDuration.toString());
    formData.append('legalConfirmed', legalConfirmed ? 'true' : 'true'); // confirmed via upload action

    try {
      setUploadProgress(50);
      const res = await fetch('/api/gifts/audio/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.error || 'Failed to upload audio file. Please try again.');
        setIsUploading(false);
        if (onUploadStateChange) onUploadStateChange(false, true);
        return;
      }

      setUploadProgress(100);

      // Safe Old Audio Cleanup (if replacing an existing custom upload)
      if (customAudioStoragePath && customAudioStoragePath !== data.storage_path) {
        try {
          fetch('/api/gifts/audio/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storage_path: customAudioStoragePath }),
          }).catch(() => {});
        } catch {}
      }

      // Update parent gift configuration with the uploaded song
      onChange({
        music_enabled: true,
        music_source: 'upload',
        library_track_id: undefined,
        custom_audio_storage_path: data.storage_path,
        custom_audio_filename: data.filename || file.name,
        audio_duration: data.duration || detectedDuration,
        playback_start_time: 0,
        playback_end_time: undefined,
        loop_enabled: true,
        music_url: data.audio_url,
        music_title: data.filename || file.name,
      });

      setTrimStartFormatted('0:00');
      setTrimEndFormatted('');
      setIsUploading(false);
      if (onUploadStateChange) onUploadStateChange(false, false);
    } catch (err: any) {
      setUploadError(err.message || 'Network error while uploading audio.');
      setIsUploading(false);
      if (onUploadStateChange) onUploadStateChange(false, true);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove uploaded song
  const handleRemoveUploadedSong = async () => {
    stopPreviewAudio();

    if (customAudioStoragePath) {
      try {
        fetch('/api/gifts/audio/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage_path: customAudioStoragePath }),
        }).catch(() => {});
      } catch {}
    }

    onChange({
      music_enabled: false,
      music_source: 'none',
      library_track_id: undefined,
      custom_audio_storage_path: undefined,
      custom_audio_filename: undefined,
      audio_duration: undefined,
      playback_start_time: 0,
      playback_end_time: undefined,
      loop_enabled: false,
      music_url: undefined,
      music_title: undefined,
    });
  };

  // Apply trimming segment
  const handleApplyTrim = () => {
    setTrimError(null);
    const startSec = parseAudioSeconds(trimStartFormatted);
    const endSec = trimEndFormatted.trim() ? parseAudioSeconds(trimEndFormatted) : undefined;
    const currentDur = audioDuration || (musicSource === 'library' ? getMusicTrackById(libraryTrackId)?.duration : undefined);

    const validation = validatePlaybackTrim(startSec, endSec, currentDur);
    if (!validation.valid) {
      setTrimError(validation.error || 'Invalid trimming range.');
      return;
    }

    onChange({
      music_enabled: musicEnabled,
      music_source: musicSource,
      library_track_id: libraryTrackId,
      custom_audio_storage_path: customAudioStoragePath,
      custom_audio_filename: customAudioFilename,
      audio_duration: audioDuration,
      playback_start_time: validation.startTime,
      playback_end_time: validation.endTime,
      loop_enabled: loopEnabled ?? true,
      music_url: musicUrl,
      music_title: musicTitle,
    });
  };

  // Reset trimming to full track
  const handleResetTrim = () => {
    setTrimStartFormatted('0:00');
    setTrimEndFormatted('');
    setTrimError(null);
    stopPreviewAudio();

    onChange({
      music_enabled: musicEnabled,
      music_source: musicSource,
      library_track_id: libraryTrackId,
      custom_audio_storage_path: customAudioStoragePath,
      custom_audio_filename: customAudioFilename,
      audio_duration: audioDuration,
      playback_start_time: 0,
      playback_end_time: undefined,
      loop_enabled: loopEnabled ?? true,
      music_url: musicUrl,
      music_title: musicTitle,
    });
  };

  // Filtered tracks for the library
  const filteredLibraryTracks = DEAR_YOU_MUSIC_LIBRARY.filter((track) => {
    if (selectedCategory === 'All') return true;
    return track.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const selectedLibraryTrack = getMusicTrackById(libraryTrackId) || DEFAULT_LIBRARY_TRACK;
  const activePlaybackUrl = musicSource === 'upload' ? musicUrl : (selectedLibraryTrack?.audio_url || '/audio/gentle-moments.mp3');

  return (
    <div className="space-y-6">
      {/* Three Primary Selection Mode Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: Dear You Music Library */}
        <button
          type="button"
          onClick={() => handleSourceSelect('library')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
            musicSource === 'library' && musicEnabled
              ? 'bg-platform-card border-platform-violet shadow-sm ring-2 ring-platform-violet/20'
              : 'bg-platform-card border-platform-border hover:bg-platform-cardSubtle text-platform-muted'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-platform-violet flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-platform-violet" />
            </div>
            {musicSource === 'library' && musicEnabled && (
              <span className="w-5 h-5 rounded-full bg-platform-violet text-white flex items-center justify-center text-[10px]">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-platform-text">
              Dear You Music Library
            </h4>
            <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
              Curated, pre-approved background tracks across 8 emotional moods.
            </p>
          </div>
        </button>

        {/* Option 2: Upload Your Own Song */}
        <button
          type="button"
          onClick={() => handleSourceSelect('upload')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
            musicSource === 'upload' && musicEnabled
              ? 'bg-platform-card border-platform-violet shadow-sm ring-2 ring-platform-violet/20'
              : 'bg-platform-card border-platform-border hover:bg-platform-cardSubtle text-platform-muted'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            {musicSource === 'upload' && musicEnabled && (
              <span className="w-5 h-5 rounded-full bg-platform-violet text-white flex items-center justify-center text-[10px]">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-platform-text">
              Upload Your Own Song
            </h4>
            <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
              Personal MP3 or M4A track (up to 5 mins, 10 MB).
            </p>
          </div>
        </button>

        {/* Option 3: No Background Music */}
        <button
          type="button"
          onClick={() => handleSourceSelect('none')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
            !musicEnabled || musicSource === 'none'
              ? 'bg-platform-card border-platform-violet shadow-sm ring-2 ring-platform-violet/20'
              : 'bg-platform-card border-platform-border hover:bg-platform-cardSubtle text-platform-muted'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 flex items-center justify-center">
              <VolumeX className="w-4 h-4" />
            </div>
            {(!musicEnabled || musicSource === 'none') && (
              <span className="w-5 h-5 rounded-full bg-platform-violet text-white flex items-center justify-center text-[10px]">
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-platform-text">
              No Background Music
            </h4>
            <p className="text-[11px] text-platform-muted mt-0.5 leading-snug">
              Quiet journey with no music playback or audio widget.
            </p>
          </div>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DEAR YOU MUSIC LIBRARY SECTION                         */}
      {/* ======================================================== */}
      {musicSource === 'library' && musicEnabled && (
        <div className="p-5 sm:p-6 rounded-3xl bg-platform-card border border-platform-border space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-platform-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-platform-violet" />
                <span>Select a Pre-Approved Background Track</span>
              </h3>
              <p className="text-xs text-platform-muted mt-0.5">
                All tracks are pre-cleared for personal keepsakes and offline export.
              </p>
            </div>

            {/* Currently Selected Badge */}
            <div className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-platform-violet text-xs font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Selected: {selectedLibraryTrack.title}</span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-platform-btnBg text-platform-btnText shadow-xs'
                  : 'bg-platform-cardSubtle text-platform-muted hover:text-platform-text border border-platform-border'
              }`}
            >
              All Categories ({DEAR_YOU_MUSIC_LIBRARY.length})
            </button>
            {MUSIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-platform-btnBg text-platform-btnText shadow-xs'
                    : 'bg-platform-cardSubtle text-platform-muted hover:text-platform-text border border-platform-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Track Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLibraryTracks.map((track) => {
              const isSelected = libraryTrackId === track.id;
              const isPlayingThis = currentlyPreviewingUrl === track.audio_url && isPreviewPlaying;

              return (
                <div
                  key={track.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-purple-50/60 dark:bg-purple-950/30 border-platform-violet ring-1 ring-platform-violet/30'
                      : 'bg-platform-cardSubtle border-platform-border hover:border-platform-border'
                  }`}
                >
                  {/* Left: Play/Pause button + Track Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => togglePlayPreview(track.audio_url)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs ${
                        isPlayingThis
                          ? 'bg-platform-violet text-white animate-pulse'
                          : 'bg-platform-card border border-platform-border text-platform-text hover:bg-platform-hover'
                      }`}
                      title={isPlayingThis ? 'Pause preview' : 'Play preview'}
                      aria-label={`${isPlayingThis ? 'Pause' : 'Preview'} ${track.title}`}
                    >
                      {isPlayingThis ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-platform-text truncate">
                          {track.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-platform-card border border-platform-border text-platform-muted">
                          {track.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-platform-muted truncate mt-0.5">
                        {track.artist} • <span className="font-mono">{track.durationFormatted}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Select Button */}
                  <button
                    type="button"
                    onClick={() => handleChooseLibraryTrack(track)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-platform-violet text-white shadow-xs'
                        : 'bg-platform-card border border-platform-border text-platform-text hover:bg-platform-hover'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. UPLOAD YOUR OWN SONG SECTION                           */}
      {/* ======================================================== */}
      {musicSource === 'upload' && musicEnabled && (
        <div className="p-5 sm:p-6 rounded-3xl bg-platform-card border border-platform-border space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-platform-text flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Upload a Custom Background Song</span>
              </h3>
              <p className="text-xs text-platform-muted mt-0.5">
                Upload a personal song specifically for this gift.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-platform-cardSubtle border border-platform-border text-platform-muted">
              MP3, M4A • Max 5m / 10MB
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Dropzone / Button if no file is uploaded yet */}
          {!customAudioStoragePath && !musicUrl ? (
            <div className="space-y-4">
              <div
                onClick={() => {
                  if (!legalConfirmed) {
                    setUploadError('Please acknowledge the copyright/permission confirmation below before uploading.');
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isUploading
                    ? 'border-indigo-400 bg-indigo-50/20'
                    : 'border-platform-border hover:border-platform-violet bg-platform-cardSubtle hover:bg-platform-card'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-platform-violet" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>

                <div className="mt-1">
                  <span className="text-xs sm:text-sm font-semibold text-platform-text">
                    {isUploading ? 'Uploading audio file...' : 'Click to Upload Song'}
                  </span>
                  <p className="text-xs text-platform-muted mt-0.5">
                    Supports MP3 and M4A up to 10 MB (maximum 5 minutes)
                  </p>
                </div>

                {isUploading && (
                  <div className="w-full max-w-xs mt-3">
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-platform-violet h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-platform-muted mt-1 block">
                      {uploadProgress}% processed
                    </span>
                  </div>
                )}
              </div>

              {/* Mandatory Legal Rights Acknowledgment */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-platform-cardSubtle border border-platform-border cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={legalConfirmed}
                  onChange={(e) => {
                    setLegalConfirmed(e.target.checked);
                    if (e.target.checked) setUploadError(null);
                  }}
                  className="w-4 h-4 mt-0.5 accent-purple-600 rounded cursor-pointer"
                />
                <span className="text-xs text-platform-text leading-relaxed">
                  <strong>Copyright & Permission Confirmation:</strong> I confirm that I have the right or permission to use and share this audio in my gift.
                </span>
              </label>
            </div>
          ) : (
            /* Uploaded Audio Summary Card */
            <div className="p-4 rounded-2xl bg-platform-cardSubtle border border-platform-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-platform-text truncate">
                        {customAudioFilename || musicTitle || 'Personal Audio Track'}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        READY
                      </span>
                    </div>
                    <p className="text-xs text-platform-muted mt-0.5 font-mono">
                      Duration: {audioDuration ? formatAudioSeconds(audioDuration) : 'Verified (< 5m)'}
                    </p>
                  </div>
                </div>

                {/* Play/Pause Preview of Uploaded Track */}
                {musicUrl && (
                  <button
                    type="button"
                    onClick={() => togglePlayPreview(musicUrl)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      currentlyPreviewingUrl === musicUrl && isPreviewPlaying
                        ? 'bg-platform-violet text-white animate-pulse'
                        : 'bg-platform-card border border-platform-border text-platform-text hover:bg-platform-hover'
                    }`}
                    title={currentlyPreviewingUrl === musicUrl && isPreviewPlaying ? 'Pause preview' : 'Play preview'}
                  >
                    {currentlyPreviewingUrl === musicUrl && isPreviewPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Action Buttons: Replace & Remove */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-platform-border">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-xl border border-platform-border bg-platform-card hover:bg-platform-hover text-platform-text text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>Replace Song</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveUploadedSong}
                  disabled={isUploading}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Song</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. OPTIONAL ADVANCED TRIMMING CONTROLS                   */}
      {/* ======================================================== */}
      {musicEnabled && musicSource !== 'none' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-platform-card border border-platform-border space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTrimmingPanel(!showTrimmingPanel)}
              className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-platform-text hover:text-platform-violet transition-colors cursor-pointer text-left"
            >
              <Scissors className="w-4 h-4 text-platform-violet" />
              <span>Advanced Playback Trimming (Optional)</span>
            </button>
            <span className="text-[11px] text-platform-muted font-mono">
              {playbackStartTime > 0 || playbackEndTime ? 'Custom Segment Active' : 'Default: Full Song'}
            </span>
          </div>

          <p className="text-xs text-platform-muted">
            Optionally specify exact start and end timestamps so your recipient hears only the most touching segment of the song. The player will continuously loop only this selected portion.
          </p>

          {showTrimmingPanel && (
            <div className="pt-3 border-t border-platform-border space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-platform-text mb-1">
                    Start Time (mm:ss)
                  </label>
                  <input
                    type="text"
                    value={trimStartFormatted}
                    onChange={(e) => setTrimStartFormatted(e.target.value)}
                    placeholder="0:00"
                    className="w-full px-3 py-2 rounded-xl bg-platform-inputBg text-platform-text border border-platform-inputBorder font-mono text-xs focus:border-platform-violet outline-none"
                  />
                  <span className="text-[10px] text-platform-muted mt-1 block font-mono">
                    e.g. 0:35 (starts at 35 seconds)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-platform-text mb-1">
                    End Time (mm:ss, optional)
                  </label>
                  <input
                    type="text"
                    value={trimEndFormatted}
                    onChange={(e) => setTrimEndFormatted(e.target.value)}
                    placeholder="Leave empty for song end"
                    className="w-full px-3 py-2 rounded-xl bg-platform-inputBg text-platform-text border border-platform-inputBorder font-mono text-xs focus:border-platform-violet outline-none"
                  />
                  <span className="text-[10px] text-platform-muted mt-1 block font-mono">
                    e.g. 2:45 (loops back to start time at 2m 45s)
                  </span>
                </div>
              </div>

              {trimError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{trimError}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleApplyTrim}
                  className="px-4 py-2 rounded-xl bg-platform-btnBg text-platform-btnText text-xs font-semibold hover:bg-platform-btnHover transition-all shadow-xs cursor-pointer"
                >
                  Apply Trimming Range
                </button>

                {activePlaybackUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = parseAudioSeconds(trimStartFormatted);
                      const e = trimEndFormatted.trim() ? parseAudioSeconds(trimEndFormatted) : undefined;
                      togglePlayPreview(activePlaybackUrl, s, e);
                    }}
                    className="px-3 py-2 rounded-xl border border-platform-border bg-platform-card hover:bg-platform-hover text-platform-text text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Preview Trimmed Loop</span>
                  </button>
                )}

                {(playbackStartTime > 0 || playbackEndTime) && (
                  <button
                    type="button"
                    onClick={handleResetTrim}
                    className="px-3 py-2 rounded-xl border border-platform-border bg-platform-card hover:bg-platform-hover text-platform-muted hover:text-platform-text text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Full Song</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
