import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useQueueEvents } from '@/lib/useQueueEvents';
import { cn, formatTime, relativeTime } from '@/lib/utils';
import {
  Phone, MessageSquare, Pause, ArrowRightLeft, X, Check,
  Plus, Coffee, Activity,
} from 'lucide-react';
import { img } from '@/lib/images';

export default function Staff() {
  const [company, setCompany] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard().then(d => {
      setCompany(d.company);
      setStaff(d.staff);
      setBranches(d.branches);
      setServices(d.services);
      setBranchId(d.branches[0]?.id ?? null);
    });
  }, []);

  const { tickets } = useQueueEvents([]);
  const live = useMemo(() => tickets.filter(t => t.status === 'WAITING' || t.status === 'CALLED' || t.status === 'SERVING' || t.status === 'ON_HOLD'), [tickets]);
  const head = live.find(t => t.status === 'SERVING') ?? live.find(t => t.status === 'CALLED') ?? null;
  const next = live.find(t => t.status === 'WAITING');

  const callNext = async () => {
    if (!branchId) return;
    setActionPending(true);
    try {
      const { ticket } = await api.staffCallNext(branchId, 'Counter 3');
      setNotice(`${ticket.ticketNumber} called to Counter 3.`);
    } finally { setActionPending(false); }
  };
  const markServed = async () => { if (!head) return; setActionPending(true); try { await api.staffServed(head.id); setNotice(`${head.ticketNumber} marked served.`); } finally { setActionPending(false); } };
  const markMissed = async () => { if (!head) return; setActionPending(true); try { await api.staffMissed(head.id); setNotice(`${head.ticketNumber} marked missed.`); } finally { setActionPending(false); } };
  const hold = async () => { if (!head) return; setActionPending(true); try { await api.staffHold(head.id); setNotice(`${head.ticketNumber} placed on hold.`); } finally { setActionPending(false); } };
  const transfer = async () => {
    if (!head) return;
    const targetService = services.find((service) => service.id !== head.serviceId);
    if (!targetService) {
      setNotice('No alternate service is configured for transfer.');
      return;
    }
    setActionPending(true);
    try {
      const { ticket } = await api.staffTransfer(head.id, targetService.id, 'Counter 3');
      setNotice(`${ticket.ticketNumber} transferred to ${ticket.serviceName}.`);
    } finally {
      setActionPending(false);
    }
  };
  const sendSms = async () => {
    if (!head) return;
    setActionPending(true);
    try {
      const { notification } = await api.staffSendSms(
        head.id,
        `Hi ${head.customerName.split(' ')[0]}, this is an update from ${company.name}: your ticket ${head.ticketNumber} is still active. Please keep this page open for live changes.`,
      );
      setNotice(`SMS ${notification.status.toLowerCase()} for ${head.customerName}.`);
    } finally {
      setActionPending(false);
    }
  };
  const callCustomer = () => { if (head) setNotice(`Calling ${head.customerName} from Counter 3.`); };
  const addWalkIn = async () => {
    const service = services[0];
    if (!branchId || !service) return;
    setActionPending(true);
    try {
      const { ticket } = await api.joinQueue({
        branchId,
        serviceId: service.id,
        customerName: 'Walk-in customer',
        customerPhone: '+264 81 000 0000',
        source: 'STAFF_WALK_IN',
      });
      setNotice(`Walk-in ${ticket.ticketNumber} added to ${ticket.serviceName}.`);
    } finally {
      setActionPending(false);
    }
  };

  if (!company) return <div className="card p-6 h-64 animate-pulse" />;
  const avatars = [img.personAvatar1, img.personAvatar2, img.personAvatar3, img.personAvatar4, img.personAvatar5, img.personAvatar6];
  const branch = branches.find((item) => item.id === branchId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <img src={img.personAvatar4} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="t-eyebrow text-[10px]">Counter 3 · Operator console</div>
          <h2 className="text-[16px] font-semibold text-ink">Tendai Moyo</h2>
          <p className="text-[12px] text-ink-3">{company.name} · {branch?.name ?? 'Active branch'} · Counter workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={branchId ?? ''} onChange={(e) => setBranchId(e.target.value)} className="select h-9 text-[13px]">
            <option value="">Switch branch…</option>
            {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
          </select>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
        <KpiCard label="Now serving" value={head?.ticketNumber ?? '—'} sub={head?.customerName ?? 'No active ticket'} avatar={avatars[0]} chip={head ? (head.status === 'SERVING' ? 'chip-serve' : 'chip-call') : 'chip-neutral'} chipText={head?.status ?? 'IDLE'} />
        <KpiCard label="In line" value={String(live.filter(t => t.status === 'WAITING').length)} sub={`~ wait ${next?.estimatedWaitMinutes ?? 0} min`} />
        <KpiCard label="Served today" value={String(staff.find(s => s.id === 'st_tendai')?.servedToday ?? 0)} sub="+18% vs your avg" subAccent />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Waiting list</h3>
            <span className="t-eyebrow text-[10px]">Auto-updates via WebSocket</span>
          </div>
          <hr className="hairline my-3" />
          <div className="space-y-1.5">
            <AnimatePresence>
              {live.map((t, i) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={cn(
                    'flex items-center gap-3 border px-3 py-2.5',
                    t.status === 'CALLED' ? 'border-ink bg-surface-2' :
                    t.status === 'SERVING' ? 'border-emerald-300 bg-emerald-50' :
                    t.status === 'ON_HOLD' ? 'border-line bg-surface-2' :
                    'border-line bg-surface',
                  )}
                >
                  <img src={avatars[i % avatars.length]} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="t-mono text-[13px] text-ink font-medium">{t.ticketNumber}</span>
                      <span className="text-[13px] text-ink font-medium truncate">{t.customerName}</span>
                    </div>
                    <div className="font-mono text-[11px] text-ink-3">{t.serviceName} · joined {relativeTime(t.joinedAt)}</div>
                  </div>
                  <span className={cn(
                    t.status === 'WAITING' ? 'chip-wait' :
                    t.status === 'CALLED' ? 'chip-call' :
                    t.status === 'SERVING' ? 'chip-serve' :
                    'chip-hold',
                  )}>{t.status}</span>
                </motion.div>
              ))}
              {live.length === 0 && (
                <div className="border border-dashed border-line p-8 text-center text-[12px] text-ink-3 flex flex-col items-center gap-2">
                  <Coffee size={22} className="text-ink-3" />
                  Queue is clear. Take a sip of water.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={callNext} disabled={actionPending || !next} className="btn btn-primary btn-lg w-full">
            <ArrowRightLeft size={15} /> Call next
          </button>
          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            <button onClick={markServed} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><Check size={13} /> Served</button>
            <button onClick={markMissed} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><X size={13} /> Missed</button>
            <button onClick={hold} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><Pause size={13} /> Hold</button>
            <button onClick={transfer} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><ArrowRightLeft size={13} /> Transfer</button>
          </div>
          <div className="grid grid-cols-2 gap-px bg-line border border-line">
            <button onClick={sendSms} disabled={!head || actionPending} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><MessageSquare size={13} /> SMS</button>
            <button onClick={callCustomer} disabled={!head} className="btn btn-sm btn-outline bg-surface disabled:opacity-40"><Phone size={13} /> Call</button>
          </div>
          <button type="button" onClick={addWalkIn} disabled={actionPending || !branchId || services.length === 0} className="btn btn-sm btn-ghost w-full disabled:opacity-40"><Plus size={13} /> Add walk-in</button>
          {notice && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
              {notice}
            </div>
          )}
          <div className="card p-3 mt-1">
            <div className="flex items-center gap-2 text-[12px] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {company.smsBalance.toLocaleString()} SMS credits
            </div>
            <div className="mt-0.5 t-eyebrow text-[9px]">Auto top-up ON · refills at 200</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-ink">Branch activity</h3>
            <Activity size={14} className="text-ink-3" />
          </div>
          <hr className="hairline my-3" />
          <ol className="space-y-2.5">
            {[
              { t: '12:42', who: 'Linda K.',     what: 'was served at Counter 3',          avatar: img.personAvatar3 },
              { t: '12:38', who: 'Joseph T.',    what: 'joined the queue · Account opening', avatar: img.personAvatar2 },
              { t: '12:36', who: 'Daniel M.',    what: 'was called to Counter 1',           avatar: img.personAvatar4 },
              { t: '12:30', who: 'Maria N.',     what: 'joined the queue · Personal banking', avatar: img.personAvatar1 },
              { t: '12:24', who: 'Senior Citizen', what: 'joined the queue · Priority',       avatar: img.personAvatar5 },
            ].map((e, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[12px] border-b border-dashed border-line pb-2.5 last:border-0 last:pb-0">
                <img src={e.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-ink"><span className="font-medium">{e.who}</span> <span className="text-ink-2">{e.what}</span></div>
                </div>
                <div className="t-mono text-[10px] text-ink-3">{e.t}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="card overflow-hidden">
          <div className="aspect-[4/3] bg-surface-2">
            <img src={img.bankCounter} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-4">
            <h3 className="text-[14px] font-semibold text-ink">Counter 3</h3>
            <p className="text-[12px] text-ink-3 mt-1">Personal banking. 3 staff on shift.</p>
            <hr className="hairline my-3" />
            <div className="flex items-center gap-2 text-[12px] text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Avg service 5m · 42 served today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, avatar, chip, chipText, subAccent }: { label: string; value: string; sub?: string; avatar?: string; chip?: string; chipText?: string; subAccent?: boolean }) {
  return (
    <div className="bg-surface p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="t-eyebrow text-[10px]">{label}</div>
        <div className="t-mono text-2xl text-ink font-semibold mt-0.5">{value}</div>
        {sub && <div className={cn('font-mono text-[11px] mt-0.5', subAccent ? 'text-emerald-700' : 'text-ink-3')}>{sub}</div>}
      </div>
      {avatar ? (
        <div className="flex flex-col items-end gap-1.5">
          <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
          {chip && <span className={cn(chip, 'text-[9px]')}>{chipText}</span>}
        </div>
      ) : null}
    </div>
  );
}
