import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

type CustomerRow = { id: string; name: string; phone: string; email?: string; createdAt: string; tickets: number; reservations: number };

export default function CustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    api.liveQueue()
      .then(async (d: any) => {
        const all = d.tickets as any[];
        // Derive customers from tickets since we don't have a direct customer list endpoint.
        const map = new Map<string, CustomerRow>();
        for (const ticket of all) {
          const key = ticket.customerPhone;
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: ticket.customerName,
              phone: ticket.customerPhone,
              createdAt: ticket.joinedAt,
              tickets: 0,
              reservations: 0,
            });
          }
          const row = map.get(key)!;
          row.tickets += 1;
        }
        if (mounted) setRows(Array.from(map.values()));
      })
      .catch((err) => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = rows.filter((row) => {
    if (!search.trim()) return true;
    const haystack = `${row.name} ${row.phone} ${row.email ?? ''}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-[18px] font-semibold text-ink">Customers</h2>
            <p className="text-[12px] text-ink-3 mt-0.5">Search customers seen at your queues this week</p>
          </div>
          <div className="relative">
            <Search size={13} className="text-ink-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input className="input h-9 pl-8 text-[12px] w-64" placeholder="Name, phone, or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</div>}

        <section className="card p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-line">
            <h3 className="text-[14px] font-semibold text-ink">Recent customers</h3>
            <p className="t-eyebrow text-[10px] mt-0.5">{filtered.length} matches</p>
          </div>
          {loading ? (
            <div className="p-5 text-[12px] text-ink-3">Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[12px] text-ink-3">No customers in the live queue match that search.</div>
          ) : (
            <div className="divide-y divide-line">
              {filtered.slice(0, 50).map((row) => (
                <div key={row.id} className="grid md:grid-cols-[1fr_180px_120px_120px] gap-3 items-center px-5 py-3 text-[12px]">
                  <div>
                    <div className="font-medium text-ink">{row.name}</div>
                    <div className="font-mono text-[10px] text-ink-3 mt-0.5">{row.email ?? 'no email'}</div>
                  </div>
                  <div className="font-mono text-ink-2">{row.phone}</div>
                  <div className="text-right t-mono text-ink font-semibold">{row.tickets}</div>
                  <div className="text-right text-[10px] text-ink-3">live tickets</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
