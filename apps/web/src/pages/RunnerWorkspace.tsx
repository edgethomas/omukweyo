import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock3, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import { api } from '@/lib/api';

const RUNNER_KEY = 'inline_runner';

function loadRunner() {
  try {
    const raw = localStorage.getItem(RUNNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-NA', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function RunnerWorkspace() {
  const [runner] = useState<any>(() => loadRunner());
  const [jobs, setJobs] = useState<any[]>([]);
  const [acceptedJobId, setAcceptedJobId] = useState<string | null>(null);
  const [checkInSent, setCheckInSent] = useState(false);
  const [proofSent, setProofSent] = useState(false);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.runnerJobs()
      .then((payload) => setJobs(payload.jobs))
      .catch((err) => setError(err.message));
  }, []);

  const acceptedJob = useMemo(
    () => jobs.find((job) => job.id === acceptedJobId) ?? null,
    [jobs, acceptedJobId],
  );
  const openJobCount = useMemo(
    () => jobs.filter((job) => job.status === 'OPEN').length,
    [jobs],
  );

  const acceptJob = async (jobId: string) => {
    setActionPending(`accept-${jobId}`);
    setError(null);
    try {
      const payload = await api.runnerAcceptJob(jobId, runner?.name);
      setJobs(payload.jobs);
      setAcceptedJobId(jobId);
      setCheckInSent(false);
      setProofSent(false);
      setNotice('Job accepted. Check in when you arrive at the location.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionPending(null);
    }
  };

  const checkIn = async () => {
    if (!acceptedJob) return;
    setActionPending('check-in');
    setError(null);
    try {
      const payload = await api.runnerCheckIn(acceptedJob.id);
      setJobs(payload.jobs);
      setCheckInSent(true);
      setNotice('Location check-in saved and customer SMS logged.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionPending(null);
    }
  };

  const sendProof = async () => {
    if (!acceptedJob) return;
    setActionPending('proof');
    setError(null);
    try {
      const payload = await api.runnerProof(acceptedJob.id, 'Position 4, timestamp proof uploaded from runner workbench.');
      setJobs(payload.jobs);
      setProofSent(true);
      setNotice('Proof update sent to customer and support.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionPending(null);
    }
  };

  const completeJob = async () => {
    if (!acceptedJob) return;
    setActionPending('complete');
    setError(null);
    try {
      const payload = await api.runnerComplete(acceptedJob.id);
      setJobs(payload.jobs);
      setNotice('Handoff complete. Customer SMS logged and payout marked for release.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionPending(null);
    }
  };

  if (!runner) {
    return (
      <div className="space-y-5">
        <section className="card p-6">
          <div className="t-eyebrow mb-2">Runner workbench</div>
          <h2 className="t-h2 max-w-2xl">Apply first to access runner jobs.</h2>
          <p className="t-body mt-3 max-w-2xl">The workbench shows allowed public-line jobs, payout, location proof, and handoff status.</p>
          <Link to="/runner/signup" className="btn btn-primary btn-md mt-5">Apply as runner</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="t-eyebrow mb-2">Runner workbench</div>
            <h2 className="t-h2">{runner.name}</h2>
            <p className="text-[13px] text-ink-2 mt-1">{runner.city} - {runner.phone} - {runner.status}</p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden min-w-[320px]">
            <MiniStat label="Open jobs" value={openJobCount} />
            <MiniStat label="Rating" value="New" />
            <MiniStat label="Payout" value="N$0" />
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}
      {notice && <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{notice}</div>}

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Available jobs</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">Normal public lines only</p>
          </div>
          <div className="divide-y divide-line">
            {jobs.map((job) => (
              <div key={job.id} className="p-5 grid lg:grid-cols-[1fr_150px] gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-semibold text-ink">{job.placeName}</h4>
                    <span className={job.status === 'OPEN' ? 'chip-wait' : job.status === 'COMPLETE' ? 'chip-done' : 'chip-serve'}>
                      {job.status}
                    </span>
                  </div>
                  <div className="text-[12px] text-ink-2 mt-1">{job.serviceName} for {job.customerName}</div>
                  <div className="grid sm:grid-cols-3 gap-3 mt-4 text-[12px] text-ink-2">
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {job.city}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {job.expectedWaitMinutes} min wait</span>
                    <span className="inline-flex items-center gap-1.5"><Wallet size={13} /> N${(job.payoutCents / 100).toFixed(0)}</span>
                  </div>
                  <p className="text-[12px] text-ink-2 mt-3">{job.instructions}</p>
                </div>
                <div className="flex lg:flex-col gap-2 lg:items-stretch">
                  <button
                    disabled={(!!acceptedJobId && acceptedJobId !== job.id) || actionPending === `accept-${job.id}` || job.status === 'COMPLETE'}
                    onClick={() => acceptJob(job.id)}
                    className="btn btn-primary btn-sm"
                  >
                    {job.status === 'COMPLETE' ? 'Completed' : acceptedJobId === job.id || job.status !== 'OPEN' ? job.status : actionPending === `accept-${job.id}` ? 'Accepting...' : 'Accept job'}
                  </button>
                  <div className="text-[11px] text-ink-3 lg:text-right">{formatDateTime(job.targetArrivalAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="t-eyebrow mb-2">Active handoff</div>
            {acceptedJob ? (
              <div>
                <h3 className="text-[14px] font-semibold text-ink">{acceptedJob.placeName}</h3>
                <p className="text-[12px] text-ink-2 mt-1">Arrive before {formatDateTime(acceptedJob.targetArrivalAt)}.</p>
                <div className="mt-4 space-y-2">
                  <button type="button" onClick={checkIn} disabled={!!actionPending || acceptedJob.status === 'COMPLETE'} className="btn btn-outline btn-sm w-full disabled:opacity-40">
                    <MapPin size={13} /> Check in at location
                  </button>
                  <button onClick={sendProof} disabled={!!actionPending || acceptedJob.status === 'COMPLETE'} className="btn btn-primary btn-sm w-full disabled:opacity-40">
                    <ShieldCheck size={13} /> Send proof update
                  </button>
                  <button onClick={completeJob} disabled={!!actionPending || acceptedJob.status === 'COMPLETE'} className="btn btn-outline btn-sm w-full disabled:opacity-40">
                    <CheckCircle2 size={13} /> Complete handoff
                  </button>
                </div>
                {proofSent && (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    Proof update sent to customer and support.
                  </div>
                )}
                {checkInSent && !proofSent && (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 flex gap-2">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                    Location check-in saved for support review.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-ink-2">Accept a job to see location proof, customer handoff, and payout steps.</p>
            )}
          </div>
          <div className="card p-5">
            <div className="t-eyebrow mb-3">Rules</div>
            <ul className="space-y-2 text-[12px] text-ink-2">
              <li>Stand only in a normal line where allowed.</li>
              <li>No fake documents, impersonation, or queue cutting.</li>
              <li>Keep updates visible to customer and support.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface p-3">
      <div className="t-eyebrow text-[9px]">{label}</div>
      <div className="t-mono text-[16px] font-semibold text-ink mt-0.5">{value}</div>
    </div>
  );
}
