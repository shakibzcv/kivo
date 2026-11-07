'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chats');
  }, [router]);

  return null;
}
