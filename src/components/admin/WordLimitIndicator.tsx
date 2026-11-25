'use client';

import React from 'react';
import { countWords, getWordCountFeedback } from '@/lib/config/content-limits';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface WordLimitIndicatorProps {
  currentWords?: number;
  text?: string;
  maxWords: number;
  enabled?: boolean;
  className?: string;
  showFeedbackText?: boolean;
}

export function WordLimitIndicator({
  currentWords: explicitCurrent,
  text,
  maxWords,
  enabled = true,
  className = '',
  showFeedbackText = true,
}: WordLimitIndicatorProps) {
  if (!enabled || maxWords <= 0) return null;

  const current =
    typeof explicitCurrent === 'number'
      ? explicitCurrent
      : countWords(text || '');

  const { message, tone, remaining, percentage } = getWordCountFeedback(
    current,
    maxWords
  );

  // Determine bar color based on tone
  let barColor = 'bg-platform-violet/60';
  let badgeColor = 'text-stone-500 bg-stone-100';
  let textColor = 'text-stone-500';

  if (tone === 'warning') {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 border border-amber-200/60';
    textColor = 'text-amber-700';
  } else if (tone === 'limit') {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border border-rose-200/60';
    textColor = 'text-rose-700';
  } else if (tone === 'exceeded') {
    barColor = 'bg-red-600';
    badgeColor = 'text-red-700 bg-red-50 border border-red-300';
    textColor = 'text-red-600';
  }

  return (
    <div className={`space-y-1.5 pt-1 ${className}`}>
      <div className="flex items-center justify-between text-[11px] leading-tight">
        <span className={`font-mono font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
          {current} / {maxWords} words
        </span>

        <span className={`font-sans text-[11px] ${textColor}`}>
          {current > maxWords ? (
            <span className="font-semibold">{current - maxWords} words over limit</span>
          ) : (
            <span>{remaining} {remaining === 1 ? 'word' : 'words'} remaining</span>
          )}
        </span>
      </div>

      {/* Subtle Progress Bar */}
      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Friendly context message when approaching or at limit */}
      {showFeedbackText && (tone !== 'normal' || current > 0) && (
        <p className={`text-[11px] leading-snug flex items-center gap-1 ${textColor}`}>
          {tone === 'warning' && <Sparkles className="w-3 h-3 shrink-0 text-amber-500" />}
          {tone === 'limit' && <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />}
          {tone === 'exceeded' && <AlertCircle className="w-3 h-3 shrink-0 text-red-600" />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}

interface ControlledFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  maxWords: number;
  enabled?: boolean;
  placeholder?: string;
  helperText?: string;
  rows?: number;
  className?: string;
  required?: boolean;
}

/**
 * Standard text input with word limit enforcement and feedback
 */
export function LimitedInput({
  label,
  value,
  onChange,
  maxWords,
  enabled = true,
  placeholder,
  helperText,
  className = '',
  required = false,
}: ControlledFieldProps) {
  const currentCount = countWords(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    const nextCount = countWords(nextVal);

    // If new text is shorter or deleting, always allow
    if (nextVal.length < value.length) {
      onChange(nextVal);
      return;
    }

    // If already exceeding (legacy) and typing more words, block
    if (enabled && nextCount > maxWords && nextCount > currentCount) {
      return;
    }

    onChange(nextVal);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-platform-text">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {enabled && (
          <span className="text-[10px] font-mono text-stone-400">
            Max {maxWords} words
          </span>
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-platform-inputBorder bg-platform-inputBg text-xs sm:text-sm text-platform-text placeholder:text-platform-placeholder focus:outline-none focus:ring-2 focus:ring-platform-violet/20 focus:border-platform-violet transition-all"
      />

      {helperText && (
        <p className="text-[11px] text-platform-muted">{helperText}</p>
      )}

      {enabled && (
        <WordLimitIndicator
          text={value}
          maxWords={maxWords}
          enabled={enabled}
        />
      )}
    </div>
  );
}

/**
 * Textarea with word limit enforcement and feedback
 */
export function LimitedTextarea({
  label,
  value,
  onChange,
  maxWords,
  enabled = true,
  placeholder,
  helperText,
  rows = 4,
  className = '',
  required = false,
}: ControlledFieldProps) {
  const currentCount = countWords(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    const nextCount = countWords(nextVal);

    // If new text is shorter or user is deleting characters, always allow
    if (nextVal.length < value.length) {
      onChange(nextVal);
      return;
    }

    // If exceeding and typing additional words, prevent addition
    if (enabled && nextCount > maxWords && nextCount > currentCount) {
      return;
    }

    onChange(nextVal);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-platform-text">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {enabled && (
          <span className="text-[10px] font-mono text-stone-400">
            Max {maxWords} words
          </span>
        )}
      </div>

      <textarea
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-platform-inputBorder bg-platform-inputBg text-xs sm:text-sm text-platform-text placeholder:text-platform-placeholder focus:outline-none focus:ring-2 focus:ring-platform-violet/20 focus:border-platform-violet transition-all resize-y"
      />

      {helperText && (
        <p className="text-[11px] text-platform-muted">{helperText}</p>
      )}

      {enabled && (
        <WordLimitIndicator
          text={value}
          maxWords={maxWords}
          enabled={enabled}
        />
      )}
    </div>
  );
}
