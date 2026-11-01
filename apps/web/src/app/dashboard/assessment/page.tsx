import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ProblemBrowser } from './_components/ProblemBrowser';

function BrowserFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-(--color-text-muted)">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading problems…
    </div>
  );
}

export default function AssessmentIndexPage() {
  return (
    <PageContainer>
      <PageHeader
        kicker="Code editor"
        title="Coding Assessments"
        description="Solve real interview problems in a full IDE with a Monaco editor. Filter by topic, company, or your progress, then run your solution against test cases."
        className="mb-8"
      />
      <Suspense fallback={<BrowserFallback />}>
        <ProblemBrowser />
      </Suspense>
    </PageContainer>
  );
}
