import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="container-x py-12">
      <h1 className="t-h1 text-balance max-w-3xl">Book a walkthrough. 30 minutes. Your queues.</h1>
      <p className="t-body mt-3 max-w-2xl">We'll do a live demo on your real branches, your real services, and your real customer flow. No slideware. No script. Free, no obligation.</p>

      <div className="mt-8 grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 space-y-2.5">
          <Info icon={MapPin} title="Headquarters" body={<>Edge Work HQ · 3rd Floor, Maerua Mall Tower<br/>Windhoek, Namibia</>} />
          <Info icon={Mail} title="Email" body={<>hello@omukweyo.app<br/>sales@omukweyo.app</>} />
          <Info icon={Phone} title="Phone" body={<>+264 81 432 1100<br/>Mon-Fri 8am-5pm WAT</>} />
          <Info icon={Clock} title="Response time" body={<>Free: 48h · Starter: 24h<br/>Business: 8h · Enterprise: 1h SLA</>} />
        </div>
        <div className="md:col-span-3">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, title, body }: { icon: any; title: string; body: React.ReactNode }) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="h-8 w-8 border border-line grid place-items-center text-ink-2 shrink-0 rounded-md">
        <Icon size={14} />
      </div>
      <div>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="text-[12px] text-ink-2 mt-0.5">{body}</div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="card p-5">
      {submitted ? (
        <div className="py-10 text-center">
          <div className="t-eyebrow mb-2 text-emerald-700">Received</div>
          <h3 className="text-[18px] font-semibold text-ink">Thanks — we'll be in touch.</h3>
          <p className="text-[12px] text-ink-2 mt-1.5">Expect a reply within one business day with time options.</p>
          <button type="button" onClick={() => setSubmitted(false)} className="btn btn-outline btn-sm mt-5">Send another</button>
        </div>
      ) : (
        <>
          <h3 className="text-[15px] font-semibold text-ink">Book a walkthrough</h3>
          <p className="text-[12px] text-ink-3 mb-4">Free. 30 minutes. Your real queues.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Full name" placeholder="Your name" required />
            <Field label="Work email" type="email" placeholder="you@company.com" required />
            <Field label="Company" placeholder="e.g. City Service Center" required />
            <Select label="Industry" options={['Banking & financial services','Healthcare & clinic','Government office','Salon & spa','School & university','Restaurant & food','Telco & retail','Other']} required />
            <Field label="Number of branches" type="number" min={1} placeholder="1" />
          </div>
          <div className="mt-3">
            <label className="label">Tell us about your queue (optional)</label>
            <textarea rows={3} placeholder="e.g. 200 customers/day, paper list, no SMS today…" className="input min-h-[80px] py-2" />
          </div>
          <label className="flex items-start gap-2 mt-4 text-[12px] text-ink-2">
            <input type="checkbox" required className="mt-0.5" />
            <span>I agree to Omukweyo's <Link to="/privacy" className="text-accent hover:underline">privacy policy</Link> and consent to be contacted.</span>
          </label>
          <button type="submit" className="btn btn-primary w-full mt-4">Book walkthrough</button>
          <div className="text-center t-eyebrow text-[9px] my-3">or</div>
          <Link to="/onboarding" className="btn btn-outline w-full">Just start free</Link>
        </>
      )}
    </form>
  );
}

function Field({ label, ...rest }: any) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input {...rest} className="input" />
    </label>
  );
}

function Select({ label, options, ...rest }: any) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select {...rest} className="select">
        <option value="">Choose one…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
