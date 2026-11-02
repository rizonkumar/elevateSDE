'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Building, Loader2 } from 'lucide-react';
import type { CompanyDto } from '@elevatesde/shared-types';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { listCompanies } from '@/lib/taxonomy-api';
import { ProgressRing } from './_components/ProgressRing';

export default function CompaniesPage() {
  const [companies, setCompanies] = React.useState<CompanyDto[]>([]);
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    listCompanies()
      .then((data) => {
        if (active) setCompanies(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visible = normalizedQuery
    ? companies.filter((company) => company.name.toLowerCase().includes(normalizedQuery))
    : companies;

  const renderBody = (): React.ReactNode => {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading companies…
        </div>
      );
    }
    if (error) {
      return (
        <div className="py-24 text-center text-sm text-(--color-danger)">
          Could not load companies. Please refresh and try again.
        </div>
      );
    }
    if (companies.length === 0) {
      return (
        <div className="flex flex-col items-center py-24 text-center">
          <Building className="mb-3 h-8 w-8 text-(--color-text-muted)" />
          <p className="m-0 text-sm text-(--color-text-muted)">
            No company question sets have been published yet.
          </p>
        </div>
      );
    }
    if (visible.length === 0) {
      return (
        <div className="py-24 text-center text-sm text-(--color-text-muted)">
          No companies match “{query.trim()}”.
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((company) => (
          <Link
            key={company.id}
            href={`/dashboard/companies/${company.slug}`}
            className="group flex items-center gap-4 rounded-md border border-(--color-border-subtle) bg-(--color-surface) p-5 shadow-(--shadow-card) transition-colors hover:border-(--color-accent)"
          >
            <ProgressRing solved={company.solvedCount} total={company.problemCount} />
            <div className="min-w-0 flex-1">
              <h2 className="m-0 truncate font-display text-base font-semibold tracking-tight text-(--color-text-primary)">
                {company.name}
              </h2>
              <p className="mt-1 mb-0 text-xs text-(--color-text-muted)">
                {company.solvedCount} of {company.problemCount} solved
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5 group-hover:text-(--color-accent)" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader
        kicker="Practice"
        title="Company Questions"
        description="Practise the problems each company asks most often, ranked by frequency, and track how much of each set you have covered."
        className="mb-8"
      />
      {companies.length > 0 && (
        <div className="mb-6 w-full sm:max-w-sm">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search companies…"
            aria-label="Search companies"
            className="w-full rounded-md border border-(--color-border-subtle) bg-(--color-surface) px-3 py-2 text-sm text-(--color-text-primary) outline-none transition-colors focus:border-(--color-accent)"
          />
        </div>
      )}
      {renderBody()}
    </PageContainer>
  );
}
