import { Link } from 'react-router-dom';

const copy = {
  privacy: {
    title: 'Privacy policy',
    intro: 'How Omukweyo handles customer, business, staff, runner, ticket, and reservation data.',
    sections: [
      ['Data we collect', 'Names, phone numbers, emails, queue tickets, reservation windows, runner applications, and business setup details entered into the app.'],
      ['How it is used', 'To create tickets, send queue updates, reserve future places, operate staff consoles, manage billing, and support platform oversight.'],
      ['Visibility', 'Customers see their own tickets and reservations. Businesses see their queue operations. Platform admins see aggregated operational and role coverage data.'],
      ['Contact', 'For privacy requests, use the contact form or email hello@omukweyo.com.'],
    ],
  },
  terms: {
    title: 'Terms of service',
    intro: 'The operating rules for using Omukweyo as a customer, business, staff member, runner, or platform admin.',
    sections: [
      ['Customer use', 'Customers must enter accurate contact details and only reserve queue places they intend to use.'],
      ['Business use', 'Businesses are responsible for service setup, counter operations, and honoring tickets created through their public queue pages.'],
      ['Runner use', 'Runners may only hold spots in normal public lines where this is allowed, with clear proof and customer updates.'],
      ['Billing', 'Payments, subscriptions, and invoices are recorded against the workspace that created them.'],
    ],
  },
} as const;

export default function Legal({ type }: { type: keyof typeof copy }) {
  const page = copy[type];

  return (
    <section className="container-x py-12">
      <div className="max-w-3xl">
        <div className="t-eyebrow mb-2">Legal</div>
        <h1 className="t-h1">{page.title}</h1>
        <p className="t-body mt-3">{page.intro}</p>
      </div>
      <div className="mt-8 grid md:grid-cols-2 gap-px bg-line border border-line rounded-lg overflow-hidden">
        {page.sections.map(([title, body]) => (
          <article key={title} className="bg-surface p-5">
            <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
            <p className="text-[12px] text-ink-2 mt-2 leading-relaxed">{body}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/contact" className="btn btn-primary btn-md">Contact Omukweyo</Link>
        <Link to="/signup" className="btn btn-outline btn-md">Sign up</Link>
      </div>
    </section>
  );
}
