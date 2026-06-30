import { useEffect, useState } from 'react';
import { Plus, RefreshCw, UserPlus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, relativeTime } from '@/lib/utils';
import DashboardLayout from './DashboardLayout';

type StaffRow = { id: string; name: string; role: string; counter: string; branchId?: string; servedToday: number; rating: number };
type Branch = { id: string; name: string };

function roleLabel(role: string) {
  if (role === 'OWNER') return 'Owner';
  if (role === 'MANAGER') return 'Manager';
  return 'Operator';
}

function roleAccent(role: string) {
  if (role === 'OWNER') return 'border-accent bg-accent-soft text-ink';
  if (role === 'MANAGER') return 'border-blue-200 bg-blue-50 text-blue-800';
  return 'border-line bg-surface text-ink-2';
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'OPERATOR', counter: 'Counter 1', branchId: '' });
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    api.businessWorkspace()
      .then((payload: any) => {
        setStaff(payload.staff ?? []);
        setBranches(payload.branches ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setPending(true);
    setNotice(null);
    try {
      await api.inviteStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        counter: form.counter,
        branchId: form.branchId || undefined,
      });
      setNotice({ kind: 'ok', text: `Invite ready for ${form.email}.` });
      setForm({ name: '', email: '', role: 'OPERATOR', counter: 'Counter 1', branchId: form.branchId });
      load();
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setPending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Staff</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">{staff.length} staff accounts - owner, manager, and operator roles</p>
          </div>
          <button type="button" onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Refresh</button>
        </div>

        {notice && (
          <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
            {notice.text}
          </div>
        )}

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">All staff</h3>
            <span className="t-eyebrow text-[10px]">{staff.length} accounts</span>
          </div>
          {loading ? (
            <div className="p-5 text-[12px] text-ink-3">Loading staff...</div>
          ) : error ? (
            <div className="p-5 text-[12px] text-red-700">{error}</div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-ink-3">No staff yet. Invite the first one below.</div>
          ) : (
            <div className="divide-y divide-line">
              {staff.map((member) => (
                <div key={member.id} className="grid md:grid-cols-[1fr_180px_120px_120px] gap-3 items-center px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[13px] font-semibold text-ink truncate">{member.name}</h4>
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', roleAccent(member.role))}>{roleLabel(member.role)}</span>
                    </div>
                    <p className="text-[11px] text-ink-3 mt-1">Counter: {member.counter}{member.branchId ? ` - ${branches.find((b) => b.id === member.branchId)?.name ?? ''}` : ''}</p>
                  </div>
                  <div className="text-[11px] text-ink-2 truncate">
                    <Users size={11} className="inline mr-1" /> {member.servedToday} served today
                  </div>
                  <div className="text-right text-[11px] text-ink-2">
                    <span className="text-amber-600">★ {member.rating.toFixed(1)}</span>
                  </div>
                  <div className="text-right text-[10px] text-ink-3">
                    Updated {relativeTime(new Date().toISOString())}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h3 className="text-[14px] font-semibold text-ink">Invite a new staff member</h3>
          <p className="text-[12px] text-ink-3 mt-1">Owners see and edit everything. Managers supervise branches. Operators only see the counter.</p>
          <form onSubmit={submit} className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Full name</span>
              <input className="input" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Tendai Moyo" />
            </label>
            <label className="block">
              <span className="label">Email</span>
              <input className="input" required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="staff@yourcompany.com" />
            </label>
            <label className="block">
              <span className="label">Role</span>
              <select className="select" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="OPERATOR">Operator (counter only)</option>
                <option value="MANAGER">Manager (branch queues, staff, reports)</option>
                <option value="OWNER">Owner (everything)</option>
              </select>
            </label>
            <label className="block">
              <span className="label">Counter</span>
              <input className="input" value={form.counter} onChange={(e) => setForm((f) => ({ ...f, counter: e.target.value }))} placeholder="Counter 1" />
            </label>
            <label className="block sm:col-span-2">
              <span className="label">Branch scope</span>
              <select className="select" value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
                <option value="">All branches (owner only)</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" className="btn btn-primary btn-md" disabled={pending}>
                <UserPlus size={13} /> {pending ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
