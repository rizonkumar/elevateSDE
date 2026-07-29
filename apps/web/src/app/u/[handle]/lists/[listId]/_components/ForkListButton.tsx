'use client';

import { useRouter } from 'next/navigation';
import { Copy } from 'lucide-react';
import { Button } from '@elevatesde/ui';
import { useAuthStore } from '@/store/auth.store';
import { useProblemSocialStore } from '@/store/problem-social.store';

interface ForkListButtonProps {
  listId: string;
}

export function ForkListButton({ listId }: Readonly<ForkListButtonProps>) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const forkList = useProblemSocialStore((state) => state.forkList);

  return (
    <Button
      variant="secondary"
      onClick={() => {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }
        void forkList(listId).then((forked) => {
          if (forked) {
            router.push('/dashboard/lists');
          }
        });
      }}
    >
      <Copy className="h-4 w-4" />
      Fork this list
    </Button>
  );
}
