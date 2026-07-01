import { useMemo } from 'react';
import UserProfilePage from '@/features/profile/UserProfilePage';

const SESSION_KEY = 'omukweyo_session';

type Session = { user?: { role?: string } };

function roleLabel(): string {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session: Session | null = raw ? JSON.parse(raw) : null;
    if (session?.user?.role === 'COMPANY_MANAGER') return 'Business manager';
    return 'Business owner';
  } catch {
    return 'Business owner';
  }
}

export default function BusinessProfile() {
  const label = useMemo(() => roleLabel(), []);
  return (
    <UserProfilePage
      roleLabel={label}
      allowDelete
      emailRequired
      deleteMessage="Removes your personal account. The company, branches, staff, and customer history stay on the company record — only your sign-in is revoked."
    />
  );
}
