import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MapPin, RefreshCw, ShieldCheck, Upload, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTime, relativeTime } from '@/lib/utils';

export default function RunnerJobsPage() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [proofMessage, setProofMessage] = useState('');
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.runnerJobs().then((d) => {
      const found = d.jobs.find((j: any) => j.id === id);
      setJob(found);
    });
  }, [id]);

  const act = async (action: 'check-in' | 'proof' | 'complete') => {
    if (!job) return;
    setActionPending(action);
    setNotice(null);
    try {
      let payload;
      if (action === 'check-in') payload = await api.runnerCheckIn(job.id);
      else if (action === 'proof') payload = await api.runnerProof(job.id, proofMessage.trim() || 'Position update from runner workbench.');
      else payload = await api.runnerComplete(job.id);
      if (payload?.job) setJob(payload.job);
      setNotice({ kind: 'ok', text: action === 'check-in' ? 'Check-in saved.' : action === 'proof' ? 'Proof sent.' : 'Handoff complete.' });
      setProofMessage('');
    } catch (err: any) {
      setNotice({ kind: 'err', text: err.message });
    } finally {
      setActionPending(null);
    }
  };

  if (!job) return <div className="card p-6 h-72 animate-pulse" />;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-2 text-[12px] text-ink-3">
        <Link to="/runner/work" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={12} /> Back to workbench</Link>
        <button type="button" onClick={() => id && api.runnerJobs().then((d) => setJob(d.jobs.find((j: any) => j.id === id)))} className="ml-auto btn btn-ghost btn-sm"><RefreshCw size={12} /> Refresh</button>
      </div>

      {notice && (
        <div className={cn('rounded-md px-3 py-2 text-[12px]', notice.kind === 'ok' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-red-200 bg-red-50 text-red-700')}>
          {notice.text}
        </div>
      )}

      <section className="card p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="t-eyebrow">Runner job</div>
            <h2 className="text-[20px] font-semibold text-ink mt-1">{job.placeName}</h2>
            <p className="text-[13px] text-ink-2 mt-1">{job.serviceName} for {job.customerName}</p>
          </div>
          <span className={cn(job.status === 'OPEN' ? 'chip-wait' : job.status === 'COMPLETE' ? 'chip-done' : 'chip-serve')}>{job.status}</span>
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden">
          <Stat icon={MapPin} label="City" value={job.city} />
          <Stat icon={ShieldCheck} label="Wait" value={`${job.expectedWaitMinutes} min`} />
          <Stat icon={Wallet} label="Payout" value={`N$${(job.payoutCents / 100).toFixed(0)}`} />
        </div>
        <p className="mt-3 text-[13px] text-ink-2">Arrive before {formatTime(job.targetArrivalAt)} ({relativeTime(job.targetArrivalAt)}).</p>
        <p className="mt-2 text-[12px] text-ink-2 leading-relaxed whitespace-pre-line">{job.instructions}</p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><MapPin size={14} /> Check in</h3>
        <button type="button" className="btn btn-primary btn-md" onClick={() => act('check-in')} disabled={!!actionPending || job.status === 'COMPLETE'}>
          Check in at location
        </button>

        <h3 className="text-[14px] font-semibold text-ink pt-2 inline-flex items-center gap-2"><Upload size={14} /> Send proof update</h3>
        <textarea
          className="input min-h-24"
          value={proofMessage}
          onChange={(e) => setProofMessage(e.target.value)}
          placeholder="Position 3, ticket behind 2 people. Photo uploaded."
        />
        <button type="button" className="btn btn-primary btn-md" onClick={() => act('proof')} disabled={!!actionPending || job.status === 'COMPLETE'}>
          Send proof
        </button>

        <h3 className="text-[14px] font-semibold text-ink pt-2 inline-flex items-center gap-2"><CheckCircle2 size={14} /> Complete handoff</h3>
        <button type="button" className="btn btn-primary btn-md" onClick={() => act('complete')} disabled={!!actionPending || job.status === 'COMPLETE'}>
          Mark complete
        </button>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center gap-1.5 t-eyebrow text-[9px]"><Icon size={12} />{label}</div>
      <div className="text-[14px] font-semibold text-ink mt-1.5">{value}</div>
    </div>
  );
}
