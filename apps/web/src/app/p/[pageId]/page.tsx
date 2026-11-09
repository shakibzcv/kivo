'use client';

import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/workspace-layout';

export default function WorkspacePageRoute() {
  const params = useParams();
  const pageId = typeof params?.pageId === 'string' ? params.pageId : null;

  return <WorkspaceLayout pageId={pageId} section="home" />;
}
