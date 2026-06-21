import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Mic2,
  Code2,
  FileText,
  Briefcase,
  Trophy,
  MessagesSquare,
  Building2,
  Check,
  ArrowUp,
} from 'lucide-react';
import { SectionShell } from './SectionShell';
import { SectionHeading } from './SectionHeading';
import { Reveal } from './Reveal';

interface TileProps {
  icon: LucideIcon;
  meta: string;
  title: string;
  body: string;
  preview?: ReactNode;
  className?: string;
}

function Tile({ icon: Icon, meta, title, body, preview, className = '' }: TileProps) {
  return (
    <div
      className={`group flex flex-col gap-5 rounded-(--radius-lg) border border-(--color-border-subtle) bg-(--color-surface) p-6 shadow-(--shadow-soft) transition-colors hover:border-(--color-accent) ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-(--radius-md) bg-(--color-accent-soft) text-(--color-accent)">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-(--color-text-muted)">
          {meta}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-(--color-text-primary)">{title}</h3>
        <p className="text-sm leading-relaxed text-(--color-text-muted)">{body}</p>
      </div>
      {preview ? <div className="mt-auto pt-2">{preview}</div> : null}
    </div>
  );
}

function MiniPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-(--radius-md) border border-(--color-border-subtle) bg-(--color-bg-soft) p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function InterviewPreview() {
  return (
    <MiniPanel className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-accent-soft) text-(--color-accent)">
          <Mic2 className="h-3 w-3" />
        </span>
        <p className="text-sm text-(--color-text-primary)">
          Walk me through how you&apos;d shard a write-heavy service.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
          Round score
        </span>
        <span className="text-sm font-semibold text-(--color-text-primary)">8.2 / 10</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['System Design', 'Senior', 'FAANG'].map((tag) => (
          <span
            key={tag}
            className="rounded-(--radius-full) border border-(--color-border-subtle) px-2 py-0.5 text-[11px] font-medium text-(--color-text-muted)"
          >
            {tag}
          </span>
        ))}
      </div>
    </MiniPanel>
  );
}

function CodePreview() {
  return (
    <MiniPanel className="flex flex-col gap-3">
      <pre className="overflow-hidden font-mono text-[11px] leading-relaxed text-(--color-text-muted)">
        <span className="text-(--color-accent)">function</span> twoSum(nums, target) {'{'}
        {'\n'}  <span className="text-(--color-accent)">const</span> seen = new Map();
        {'\n'}  ...
        {'\n'}
        {'}'}
      </pre>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-(--radius-full) bg-(--color-success-soft) px-2.5 py-1 text-[11px] font-semibold text-(--color-success)">
          <Check className="h-3 w-3" />
          12 / 12 passed
        </span>
      </div>
    </MiniPanel>
  );
}

function ResumePreview() {
  return (
    <MiniPanel className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
          ATS score
        </span>
        <span className="text-lg font-bold text-(--color-text-primary)">86</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-(--radius-full) bg-(--color-border-subtle)">
        <div className="h-full w-[86%] rounded-(--radius-full) bg-(--color-accent)" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['React', 'Node', 'Postgres'].map((skill) => (
          <span
            key={skill}
            className="rounded-(--radius-full) border border-(--color-border-subtle) px-2 py-0.5 text-[11px] font-medium text-(--color-text-muted)"
          >
            {skill}
          </span>
        ))}
      </div>
    </MiniPanel>
  );
}

function KanbanPreview() {
  const columns = [
    { label: 'Applied', count: 4 },
    { label: 'Interview', count: 2 },
    { label: 'Offer', count: 1 },
  ];
  return (
    <MiniPanel className="grid grid-cols-3 gap-2">
      {columns.map((col) => (
        <div key={col.label} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-(--color-text-muted)">
              {col.label}
            </span>
            <span className="text-[10px] text-(--color-text-muted)">{col.count}</span>
          </div>
          <div className="h-7 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface)" />
          {col.count > 1 ? (
            <div className="h-7 rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface)" />
          ) : null}
        </div>
      ))}
    </MiniPanel>
  );
}

function LeaderboardPreview() {
  const rows = [
    { rank: 1, name: 'Kenji W.', pts: '4,820' },
    { rank: 2, name: 'Priya N.', pts: '4,659' },
    { rank: 3, name: 'Raj P.', pts: '4,498' },
  ];
  return (
    <MiniPanel className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.rank} className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-(--color-accent-soft) font-mono text-[10px] font-semibold text-(--color-accent)">
              {row.rank}
            </span>
            <span className="text-sm text-(--color-text-primary)">{row.name}</span>
          </div>
          <span className="font-mono text-xs text-(--color-text-muted)">{row.pts} pts</span>
        </div>
      ))}
    </MiniPanel>
  );
}

function ForumPreview() {
  const posts = [
    { title: 'How to approach LRU cache design?', votes: 42 },
    { title: 'Behavioral round at fintech startups', votes: 28 },
  ];
  return (
    <MiniPanel className="flex flex-col gap-2.5">
      {posts.map((post) => (
        <div key={post.title} className="flex items-center gap-3">
          <span className="flex w-9 shrink-0 flex-col items-center rounded-(--radius-sm) border border-(--color-border-subtle) bg-(--color-surface) py-1">
            <ArrowUp className="h-3 w-3 text-(--color-accent)" />
            <span className="text-[10px] font-semibold text-(--color-text-primary)">
              {post.votes}
            </span>
          </span>
          <span className="truncate text-sm text-(--color-text-primary)">{post.title}</span>
        </div>
      ))}
    </MiniPanel>
  );
}

function EnterprisePreview() {
  return (
    <MiniPanel className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
          Seat usage
        </span>
        <span className="text-lg font-bold text-(--color-text-primary)">
          12<span className="text-(--color-text-muted)"> / 20</span>
        </span>
      </div>
      <div className="flex -space-x-2">
        {['M', 'L', 'S', 'D', 'A'].map((initial) => (
          <span
            key={initial}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-(--color-surface) bg-(--color-accent-soft) text-[11px] font-semibold text-(--color-accent)"
          >
            {initial}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-(--color-text-muted)">
          Plan
        </span>
        <span className="rounded-(--radius-full) border border-(--color-border-subtle) px-2 py-0.5 text-[11px] font-medium text-(--color-text-primary)">
          Team
        </span>
      </div>
    </MiniPanel>
  );
}

export function BentoFeatures() {
  return (
    <SectionShell id="features" bordered>
      <Reveal>
        <SectionHeading
          kicker="The platform"
          title="Everything you need to get hired — in one place"
          description="A complete, enterprise-grade toolkit for interview preparation. From timed practice to the signed offer, every workflow lives under one roof."
        />
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="grid gap-4 lg:grid-cols-3">
          <Tile
            icon={Mic2}
            meta="Real-time"
            title="Adaptive AI mock interviews"
            body="Answer by voice or text across System Design, DSA, Coding, and Behavioral rounds. The engine scores each answer and raises domain-specific follow-ups in real time."
            preview={<InterviewPreview />}
            className="lg:col-span-2"
          />
          <div className="flex flex-col gap-4">
            <Tile
              icon={Code2}
              meta="Monaco IDE"
              title="Coding assessments"
              body="Solve from a bank of 2,700+ problems in a full IDE, then run against test cases in an isolated sandbox."
              preview={<CodePreview />}
            />
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Tile
            icon={FileText}
            meta="ATS"
            title="Resume analyzer"
            body="Upload a resume for an instant ATS score, parsed skills, and a prioritized list of edits."
            preview={<ResumePreview />}
          />
          <Tile
            icon={Briefcase}
            meta="Kanban"
            title="Job application tracker"
            body="Track every application across stages, from applied to offer, on a drag-and-drop board."
            preview={<KanbanPreview />}
          />
          <Tile
            icon={Trophy}
            meta="Gamified"
            title="Leaderboard"
            body="Compete on points, streaks, and assessments across weekly, monthly, and all-time boards."
            preview={<LeaderboardPreview />}
          />
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mt-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Tile
            icon={MessagesSquare}
            meta="Community"
            title="Discussion forum"
            body="Ask questions, share strategies, and upvote the best answers from engineers preparing alongside you."
            preview={<ForumPreview />}
          />
          <Tile
            icon={Building2}
            meta="B2B ready"
            title="Enterprise multi-tenancy"
            body="Isolated workspaces with seat management, member invitations, and team performance — built for the companies that hire."
            preview={<EnterprisePreview />}
            className="lg:col-span-2"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
