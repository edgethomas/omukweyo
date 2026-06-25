import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, MapPin, MessageCircle, Phone, RefreshCw, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';

export default function RunnerRequestStatusPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.runnerRequestById(id).then((d) => setRequest(d.request)).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="card p-6 text-red-700">{error}</div>;
  if (!request) return <div className="card p-6 h-72 animate-pulse" />;

  const stages = [
    { key: 'OPEN', label: 'Posted' },
    { key: 'ACCEPTED', label: 'Runner accepted' },
    { key: 'IN_LINE', label: 'Runner in line' },
    { key: 'HANDOFF_READY', label: 'Near front' },
    { key: 'COMPLETE', label: 'Handoff complete' },
  ];
  const stageIndex = stages.findIndex((s) => s.key === request.status);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
        <Link to="/customer" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} /> Back to your visit</Link>
        <button type="button" onClick={() => id && api.runnerRequestById(id).then((d) => setRequest(d.request))} className="ml-auto btn btn-ghost btn-sm"><RefreshCw size={12} /> Refresh</button>
      </div>

      <section className="card p-6">
        <div className="t-eyebrow">Runner request</div>
        <h2 className="mt-1 text-[20px] font-semibold text-ink">{request.destinationName}</h2>
        <p className="text-[13px] text-ink-2 mt-1">{request.destinationCity} - {request.serviceName}</p>
        <div className="mt-4 grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          <Stat icon={Clock} label="Target arrival" value={formatTime(request.targetArrivalAt)} />
          <Stat icon={MapPin} label="Destination" value={request.destinationCity} />
          <Stat icon={Wallet} label="Max budget" value={`N$${(request.maxBudgetCents / 100).toFixed(0)}`} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={cn('text-[10px]', request.status === 'COMPLETE' ? 'chip-done' : 'chip-wait')}>{request.status}</span>
          <span className="text-[11px] text-ink-3 inline-flex items-center gap-1"><CheckCircle2 size={11} /> Posted {relativeTime(request.createdAt)}</span>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="text-[14px] font-semibold text-ink">Status timeline</h3>
        <hr className="hairline my-3" />
        <div className="grid overflow-hidden rounded-md border border-line sm:grid-cols-5">
          {stages.map((s, i) => (
            <div key={s.key} className={cn(
              'border-b border-line py-2.5 text-center last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0',
              i < stageIndex ? 'text-accent bg-accent-soft' :
              i === stageIndex ? 'bg-ink text-white' : 'text-ink-3 bg-surface-2',
            )}>
              <div className="t-mono text-[10px]">{String(i + 1).padStart(2, '0')}</div>
              <div className="font-medium text-[11px] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-ink-3">
          We text you the moment a runner accepts and each time they reach a milestone. You stay in control - cancel before check-in if plans change.
        </p>
      </section>

      <section className="card p-5">
        <h3 className="text-[14px] font-semibold text-ink">Notes for the runner</h3>
        <p className="mt-2 text-[13px] text-ink-2 leading-relaxed whitespace-pre-line">{request.instructions}</p>
      </section>

      <section className="card p-5">
        <h3 className="text-[14px] font-semibold text-ink">Need help?</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/contact" className="btn btn-outline btn-sm"><MessageCircle size={13} /> Contact support</Link>
          <a href="tel:+264811234567" className="btn btn-primary btn-sm"><Phone size={13} /> Call support</a>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-1.5 t-eyebrow text-[9px]"><Icon size={12} />{label}</div>
      <div className="text-[14px] font-semibold text-ink mt-1.5">{value}</div>
    </div>
  );
}
