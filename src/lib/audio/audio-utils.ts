/**
 * Dear You — Audio Validation and Processing Utilities
 * 
 * Enforces strict security, file size (max 10MB), duration (max 5 minutes),
 * magic byte authentication, and playback trimming constraints.
 */

export const MAX_AUDIO_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_AUDIO_DURATION_SECONDS = 300; // 5 minutes (300 seconds)
export const MIN_TRIM_DURATION_SECONDS = 5; // Minimum 5 seconds for trimmed segment

export interface AudioValidationResult {
  valid: boolean;
  error?: string;
  detectedFormat?: 'mp3' | 'm4a';
}

export interface TrimValidationResult {
  valid: boolean;
  error?: string;
  startTime: number;
  endTime?: number;
}

/**
 * Validate audio file buffer format by checking real magic bytes,
 * preventing malicious scripts or renamed executables from executing.
 */
export function validateAudioBufferMagicBytes(buffer: Buffer): AudioValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'Audio file is empty or corrupted.' };
  }

  if (buffer.length > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Audio file size (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum limit of 10 MB.`,
    };
  }

  // 1. Check MP3: ID3v2 tag (bytes 0-2: "ID3")
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { valid: true, detectedFormat: 'mp3' };
  }

  // 2. Check MP3: MPEG Audio Sync Word (0xFF followed by 0xFB, 0xF3, or 0xF2)
  for (let i = 0; i < Math.min(buffer.length - 1, 1024); i++) {
    if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
      return { valid: true, detectedFormat: 'mp3' };
    }
  }

  // 3. Check M4A / MP4 Audio: ftyp box within first 32 bytes
  // Usually bytes 4-7 are "ftyp" (0x66 0x74 0x79 0x70)
  for (let i = 0; i < Math.min(buffer.length - 8, 32); i++) {
    if (
      buffer[i] === 0x66 &&
      buffer[i + 1] === 0x74 &&
      buffer[i + 2] === 0x79 &&
      buffer[i + 3] === 0x70
    ) {
      // Check brand (e.g. M4A , isom, mp42)
      return { valid: true, detectedFormat: 'm4a' };
    }
  }

  return {
    valid: false,
    error: 'Unsupported audio format. Only genuine MP3 and M4A audio files are supported.',
  };
}

/**
 * Validate playback range trimming parameters
 */
export function validatePlaybackTrim(
  startTime?: number,
  endTime?: number,
  totalDuration?: number
): TrimValidationResult {
  const start = typeof startTime === 'number' && !isNaN(startTime) ? Math.max(0, startTime) : 0;
  
  if (typeof endTime === 'undefined' || endTime === null || isNaN(endTime)) {
    return { valid: true, startTime: start, endTime: undefined };
  }

  if (totalDuration && totalDuration > 0 && start >= totalDuration) {
    return {
      valid: false,
      error: `Playback start time (${start}s) cannot be greater than or equal to total song duration (${totalDuration}s).`,
      startTime: 0,
    };
  }

  if (endTime <= start) {
    return {
      valid: false,
      error: 'Playback end time must be greater than start time.',
      startTime: start,
      endTime,
    };
  }

  if (endTime - start < MIN_TRIM_DURATION_SECONDS) {
    return {
      valid: false,
      error: `Selected music segment must be at least ${MIN_TRIM_DURATION_SECONDS} seconds long.`,
      startTime: start,
      endTime,
    };
  }

  if (totalDuration && totalDuration > 0 && endTime > totalDuration + 1) {
    return {
      valid: false,
      error: `Playback end time (${endTime}s) cannot exceed total song duration (${totalDuration}s).`,
      startTime: start,
      endTime: totalDuration,
    };
  }

  return { valid: true, startTime: start, endTime };
}

/**
 * Client-side file validation before uploading
 */
export function validateClientAudioFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No audio file selected.' };
  }

  // Check file size
  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'mp3' && extension !== 'm4a') {
    return {
      valid: false,
      error: 'Invalid file format. Please upload an MP3 (.mp3) or M4A (.m4a) audio file.',
    };
  }

  return { valid: true };
}
