'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';
import { QuizQuestion } from '@/types/gift';

interface QuizSectionProps {
  questions?: QuizQuestion[];
  recipientName?: string;
}

export function QuizSection({ questions = [], recipientName = 'Friend' }: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentQuestionIndex];

  const handleSelectOption = (optionId: string) => {
    if (selectedAnswers[currentQuestionIndex] !== undefined) return; // already answered this question

    const updated = { ...selectedAnswers, [currentQuestionIndex]: optionId };
    setSelectedAnswers(updated);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    }, 600);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      const chosenOptionId = selectedAnswers[idx];
      const correctOpt = q.options.find((o) => o.is_correct);
      if (correctOpt && correctOpt.id === chosenOptionId) {
        score += 1;
      }
    });
    return score;
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
  };

  return (
    <section className="min-h-[75vh] px-4 py-16 flex flex-col items-center justify-center">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <span className="font-handwriting text-2xl text-[var(--theme-secondary)]">
            How well do you know us?
          </span>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl text-[var(--theme-text)] font-normal">
            Memory Quiz
          </h2>
          <p className="mt-1 text-xs text-[var(--theme-muted)]">
            A lighthearted trivia challenge about our unforgettable moments.
          </p>
        </motion.div>

        {/* Quiz Body */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--theme-surface)] border border-[var(--theme-border)] shadow-xl relative overflow-hidden">
          {!isCompleted ? (
            <div>
              {/* Progress Bar */}
              <div className="flex items-center justify-between text-xs text-[var(--theme-muted)] mb-4">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden mb-6">
                <motion.div
                  className="h-full bg-[var(--theme-primary)]"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Question Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-[var(--theme-text)] mb-6">
                    {currentQ?.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3">
                    {currentQ?.options.map((option) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === option.id;
                      const hasAnswered = selectedAnswers[currentQuestionIndex] !== undefined;

                      let buttonStyle = 'bg-black/5 dark:bg-white/5 hover:bg-black/10 border-[var(--theme-border)]';
                      if (hasAnswered) {
                        if (option.is_correct) {
                          buttonStyle = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
                        } else if (isSelected && !option.is_correct) {
                          buttonStyle = 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400';
                        }
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(option.id)}
                          disabled={hasAnswered}
                          className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${buttonStyle}`}
                        >
                          <span>{option.option_text}</span>
                          {hasAnswered && option.is_correct && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          )}
                          {hasAnswered && isSelected && !option.is_correct && (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* Completed Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--theme-primary)]/15 text-[var(--theme-primary)] mx-auto flex items-center justify-center mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[var(--theme-text)]">
                Quiz Complete!
              </h3>
              <p className="mt-2 text-sm text-[var(--theme-muted)]">
                You scored <strong className="text-[var(--theme-text)] font-semibold">{calculateScore()}</strong> out of{' '}
                <strong className="text-[var(--theme-text)] font-semibold">{questions.length}</strong>!
              </p>
              <p className="mt-3 text-xs text-[var(--theme-secondary)] italic">
                {calculateScore() === questions.length
                  ? `Flawless score! You truly know every detail, ${recipientName}!`
                  : `Wonderful memory trip! The best moments are still being written.`}
              </p>

              <button
                onClick={handleRestart}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--theme-border)] text-xs text-[var(--theme-text)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Again</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
