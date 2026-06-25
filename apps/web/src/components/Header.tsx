import { NavLink, Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from './Brand';

const primaryLinks = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

const audienceLinks = [
  { to: '/for-companies', label: 'For companies' },
  { to: '/for-customers', label: 'For customers' },
  { to: '/for-runners', label: 'For runners' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const audienceCloseTimer = useRef<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  const audienceActive = audienceLinks.some((l) => loc.pathname === l.to);

  const cancelAudienceClose = () => {
    if (audienceCloseTimer.current) {
      window.clearTimeout(audienceCloseTimer.current);
      audienceCloseTimer.current = null;
    }
  };

  const showAudienceMenu = () => {
    cancelAudienceClose();
    setAudienceOpen(true);
  };

  const scheduleAudienceClose = () => {
    cancelAudienceClose();
    audienceCloseTimer.current = window.setTimeout(() => {
      setAudienceOpen(false);
      audienceCloseTimer.current = null;
    }, 180);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    cancelAudienceClose();
    setAudienceOpen(false);
  }, [loc.pathname]);

  useEffect(() => () => cancelAudienceClose(), []);

  return (
    <header className={cn(
      'sticky top-0 z-50 h-14 bg-surface/95 backdrop-blur border-b border-line',
      scrolled ? 'shadow-sm' : '',
    )}>
      <div className="container-x relative h-full flex items-center">
        <Link to="/" aria-label="Omukweyo home" className="flex shrink-0 items-center gap-2 font-semibold text-ink">
          <BrandLogo className="[&>span:last-child]:hidden lg:[&>span:last-child]:inline" />
        </Link>

        <nav className="hidden min-[820px]:flex absolute left-1/2 -translate-x-1/2 items-center justify-center gap-1">
          {primaryLinks.slice(0, 2).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'h-9 shrink-0 whitespace-nowrap px-3 inline-flex items-center rounded-md text-[13px] font-medium transition-colors',
                  isActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink hover:bg-surface-2',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div
            className="relative"
            onMouseEnter={showAudienceMenu}
            onMouseLeave={scheduleAudienceClose}
            onFocus={showAudienceMenu}
            onBlur={(event) => {
              const next = event.relatedTarget;
              if (!(next instanceof Node) || !event.currentTarget.contains(next)) setAudienceOpen(false);
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={audienceOpen}
              className={cn(
                'h-9 shrink-0 whitespace-nowrap px-3 inline-flex items-center gap-1 rounded-md text-[13px] font-medium transition-colors',
                audienceActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink hover:bg-surface-2',
              )}
              onClick={() => {
                cancelAudienceClose();
                setAudienceOpen((s) => !s);
              }}
            >
              Use cases <ChevronDown size={14} className={cn('transition-transform', audienceOpen && 'rotate-180')} />
            </button>
            {audienceOpen && (
              <div className="absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-2">
                <div role="menu" className="rounded-lg border border-line bg-surface p-1.5 shadow-lg">
                  {audienceLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      role="menuitem"
                      className={({ isActive }) =>
                        cn(
                          'flex rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                          isActive ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                        )
                      }
                    >
                      {l.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )}
          </div>
          {primaryLinks.slice(2).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'h-9 shrink-0 whitespace-nowrap px-3 inline-flex items-center rounded-md text-[13px] font-medium transition-colors',
                  isActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink hover:bg-surface-2',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">
            Sign up <ArrowRight size={14} />
          </Link>
        </div>

        <button
          aria-label="Menu"
          className="min-[820px]:hidden ml-auto p-2 text-ink-2"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="min-[820px]:hidden border-t border-line bg-surface">
          <div className="container-x py-3 flex flex-col gap-1">
            {primaryLinks.slice(0, 2).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn('px-3 py-2 rounded-md text-sm', isActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="px-3 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-3">
              Use cases
            </div>
            {audienceLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn('ml-3 px-3 py-2 rounded-md text-sm', isActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
            {primaryLinks.slice(2).map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn('px-3 py-2 rounded-md text-sm', isActive ? 'text-ink bg-surface-2' : 'text-ink-2 hover:text-ink')
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-3 mt-2 border-t border-line">
              <Link to="/login" className="btn btn-outline btn-sm flex-1">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm flex-1">Sign up</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
