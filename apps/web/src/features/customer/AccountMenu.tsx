import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings as SettingsIcon, User } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SESSION_KEY = 'omukweyo_session';

type StoredSession = {
  token?: string;
};

type AccountMenuProps = {
  to?: string;
  name: string;
  summary?: string;
  avatarUrl?: string;
  active?: boolean;
};

function readToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession).token : undefined;
  } catch {
    return undefined;
  }
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CU';
}

export default function AccountMenu({ to = '/customer/profile', name, summary, avatarUrl, active }: AccountMenuProps) {
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    try {
      const token = readToken();
      if (token) await api.logout(token);
    } catch {
      // Local sign-out still clears the browser session.
    } finally {
      localStorage.removeItem(SESSION_KEY);
      navigate('/login');
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={cn('customer-account account-menu', (active || open) && 'active')}
      >
        <span className="customer-account-avatar">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials(name)}
        </span>
        <span className="hidden max-w-40 truncate text-[13px] font-medium sm:inline">{name}</span>
        <ChevronDown size={14} className={cn('hidden text-ink-3 transition-transform sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-line bg-surface p-1.5 shadow-lg" role="menu">
          <div className="px-3 py-2">
            <div className="truncate text-[13px] font-semibold text-ink">{name}</div>
            {summary && <div className="mt-0.5 truncate text-[12px] text-ink-3">{summary}</div>}
          </div>
          <div className="my-1 h-px bg-line" />
          <Link to={to} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            <User size={14} />
            Profile
          </Link>
          <Link to="/customer/settings" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
            <SettingsIcon size={14} />
            Settings
          </Link>
          <div className="my-1 h-px bg-line" />
          <button type="button" role="menuitem" onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
