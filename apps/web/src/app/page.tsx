'use client';

import Link from 'next/link';
import { Navbar } from '../components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-200">
      <Navbar />

      <main className="flex-1 page">
        <section className="section">
          <div className="hero">
            <div>
              <div className="hero-kicker">Enterprise AI Interview Preparation Platform</div>
              <h1 className="h1">
                Elevate your Software Engineering Career
              </h1>
              <p className="text-lg leading-relaxed text-[var(--color-text-muted)] max-w-2xl mt-4">
                Practice timed assessments, attend real-time AI-driven mock interviews, and receive personalized learning paths. Designed for both individual developers and B2B engineering teams.
              </p>
              <div className="hero-actions mt-8">
                <Link href="/register" className="btn-primary">
                  Get Started Free
                </Link>
                <Link href="/login" className="btn-ghost">
                  Access Dashboard
                </Link>
              </div>
            </div>

            <aside className="hero-meta border-l border-[var(--color-border-subtle)] pl-6 md:pl-8">
              <div className="hero-meta-row">
                <span className="hero-chip">Next-Gen SaaS</span>
                <span className="text-xs">Multi-Tenant Scoping</span>
              </div>
              <div className="hero-meta-row">
                <span className="text-xs">AI Evaluation Engine</span>
                <span>·</span>
                <span className="text-xs">pgvector Similarity</span>
              </div>
              <div className="hero-meta-row">
                <span className="text-xs">BullMQ Async Processing</span>
              </div>
              <div className="hero-meta-row">
                <span className="text-xs">Stripe Billing Integrated</span>
              </div>
            </aside>
          </div>
        </section>

        <section className="section">
          <h2 className="h2 mb-8">Selected Platform Wins</h2>
          <div className="metrics">
            <div className="metric">
              <div className="metric-value">45%</div>
              <div className="metric-label">Faster preparation iteration time</div>
            </div>
            <div className="metric">
              <div className="metric-value">98.4%</div>
              <div className="metric-label">AI evaluation accuracy compared to human seniors</div>
            </div>
            <div className="metric">
              <div className="metric-value">10k+</div>
              <div className="metric-label">Mock interview rounds simulated successfully</div>
            </div>
          </div>
        </section>

        <section className="section border-none">
          <h2 className="h2 mb-6">Designed for Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header">
                <div className="card-title">Adaptive AI Mock Interviews</div>
                <div className="card-meta">Real-time</div>
              </div>
              <div className="card-body mt-2">
                <p>
                  Submit your responses via text or audio. The engine leverages vector embeddings and LangChain to calculate your score and raise customized, domain-specific follow-ups.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Robust Enterprise Multi-Tenancy</div>
                <div className="card-meta">B2B Ready</div>
              </div>
              <div className="card-body mt-2">
                <p>
                  Seamlessly register corporate domains and grant employee accounts isolated workspace partitions. Control team progress dashboard summaries and seats allotment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-border-subtle)] py-8 mt-auto bg-[var(--color-bg)] transition-colors duration-200">
        <div className="max-w-[var(--page-max-width)] mx-auto px-[var(--page-padding-x)] flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-text-muted)] gap-4">
          <div>&copy; 2026 ElevateSDE. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--color-accent)]">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-accent)]">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
