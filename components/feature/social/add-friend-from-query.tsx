'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseFriendInviteGamertag, stripFriendInviteParam } from '@/lib/friend-invite';
import { AddFriendPrompt } from './add-friend-prompt';

interface AddFriendFromQueryProps {
  myGamertag?: string | null;
}

export function AddFriendFromQuery({ myGamertag }: AddFriendFromQueryProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const gamertag = parseFriendInviteGamertag(searchParams.get('add'));

  const handleClose = useCallback(() => {
    const nextSearch = stripFriendInviteParam(searchParams.toString());
    router.replace(`${pathname}${nextSearch}`, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!gamertag) return null;
  return <AddFriendPrompt gamertag={gamertag} myGamertag={myGamertag} onClose={handleClose} />;
}
