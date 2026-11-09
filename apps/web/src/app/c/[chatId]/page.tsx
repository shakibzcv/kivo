'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ChatSessionRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const chatId = typeof params?.chatId === 'string' ? params.chatId : '';
    if (chatId) {
      router.replace(`/chats/${chatId}`);
    } else {
      router.replace('/chats');
    }
  }, [router, params]);

  return null;
}
