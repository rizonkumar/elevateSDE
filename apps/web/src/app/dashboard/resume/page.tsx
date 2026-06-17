'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Loader2,
  AlertCircle,
  X,
  UploadCloud,
  Gauge,
  ListChecks,
} from 'lucide-react';
import { useResumeStore } from '@/store/resume.store';
import { ResumeDropzone } from './_components/ResumeDropzone';
import { AnalysisOverview } from './_components/AnalysisOverview';
import { FeedbackTabs } from './_components/FeedbackTabs';
import { UpcomingFeatures } from './_components/UpcomingFeatures';

const STEPS = [
  { icon: UploadCloud, title: 'Upload', detail: 'Drop a PDF or DOCX. Parsed in your browser.' },
  { icon: Gauge, title: 'Score', detail: 'Get an ATS score across skills and structure.' },
  { icon: ListChecks, title: 'Improve', detail: 'Apply a prioritized list of targeted edits.' },
];

export default function ResumeAnalyzerPage() {
  const { analyses, activeId, isAnalyzing, analyze, select, remove } = useResumeStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const active = analyses.find((item) => item.id === activeId) ?? null;
  const hasHistory = analyses.length > 1;

  return (
    <div className="w-full max-w-300 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-(--color-accent) mb-2">
            Resume analyzer
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            ATS Score &amp; Feedback
          </h1>
          <p className="text-sm text-(--color-text-muted) mt-1.5 mb-0 max-w-xl">
            Upload your engineering resume to see how it scores against applicant tracking
            systems and where to improve.
          </p>
        </motion.header>

        {!mounted ? (
          <div className="flex items-center justify-center py-24 text-sm text-(--color-text-muted)">
            Loading…
          </div>
        ) : analyses.length === 0 ? (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
            <div className="card">
              <ResumeDropzone onFile={analyze} isAnalyzing={isAnalyzing} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-accent-soft) text-xs font-bold text-(--color-accent)">
                        {index + 1}
                      </span>
                      <Icon className="h-4 w-4 text-(--color-text-muted)" />
                    </div>
                    <p className="mb-0 text-sm font-semibold text-(--color-text-primary)">
                      {step.title}
                    </p>
                    <p className="mb-0 text-xs leading-relaxed text-(--color-text-muted)">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {hasHistory && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-(--color-text-muted)">
                  Recent
                </span>
                {analyses.map((item) => {
                  const selected = item.id === activeId;
                  return (
                    <span
                      key={item.id}
                      className={`group inline-flex shrink-0 items-center gap-2 rounded-(--radius-full) border px-3 py-1.5 text-xs transition-colors ${
                        selected
                          ? 'border-(--color-accent) bg-(--color-accent-soft) text-(--color-accent)'
                          : 'border-(--color-border-subtle) text-(--color-text-muted) hover:border-(--color-text-muted)'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => select(item.id)}
                        className="flex max-w-40 items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                        {item.status === 'COMPLETED' && item.atsScore !== null && (
                          <span className="font-semibold">· {item.atsScore}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => remove(item.id)}
                        className="opacity-60 transition-opacity hover:opacity-100 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {active?.status === 'PROCESSING' && (
              <div className="card flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-(--color-accent)" />
                <p className="mb-0 text-sm text-(--color-text-muted)">
                  Reading and scoring {active.fileName}…
                </p>
              </div>
            )}

            {active?.status === 'FAILED' && (
              <div className="card flex flex-col items-center gap-4 py-16 text-center">
                <AlertCircle className="h-7 w-7 text-rose-500" />
                <p className="mb-0 text-sm text-(--color-text-muted)">
                  We couldn&apos;t read {active.fileName}. Try a different PDF or DOCX file.
                </p>
                <div className="w-full max-w-md">
                  <ResumeDropzone
                    variant="compact"
                    onFile={analyze}
                    isAnalyzing={isAnalyzing}
                    fileName={null}
                  />
                </div>
              </div>
            )}

            {active?.status === 'COMPLETED' && (
              <>
                <AnalysisOverview analysis={active} isAnalyzing={isAnalyzing} onFile={analyze} />
                <FeedbackTabs analysis={active} />
              </>
            )}
          </div>
        )}

        {mounted && <UpcomingFeatures />}
    </div>
  );
}
