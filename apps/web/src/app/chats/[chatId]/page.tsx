'use client';

import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/workspace-layout';

export default function ChatsSlugRoute() {
  const params = useParams();
  const chatId = typeof params?.chatId === 'string' ? params.chatId : null;

  return <WorkspaceLayout chatId={chatId} section="chat" />;
}
