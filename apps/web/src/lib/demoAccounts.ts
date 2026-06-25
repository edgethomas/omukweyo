export type DemoAccount = {
  role: 'Customer' | 'Business owner' | 'Staff' | 'Runner' | 'Platform admin';
  name: string;
  email: string;
  password: string;
  destination: string;
  description: string;
};

export const demoPassword = 'demo123';

export const demoAccounts: DemoAccount[] = [
  {
    role: 'Customer',
    name: 'Martha Customer',
    email: 'customer@omukweyo.demo',
    password: demoPassword,
    destination: '/customer',
    description: 'Reservations, paid future spots, and live tickets.',
  },
  {
    role: 'Business owner',
    name: 'Selma Owner',
    email: 'owner@omukweyo.demo',
    password: demoPassword,
    destination: '/dashboard',
    description: 'Branches, analytics, billing, and public queue pages.',
  },
  {
    role: 'Staff',
    name: 'Tendai Staff',
    email: 'staff@omukweyo.demo',
    password: demoPassword,
    destination: '/staff',
    description: 'Call next, serve, miss, hold, and transfer tickets.',
  },
  {
    role: 'Runner',
    name: 'Jonas Runner',
    email: 'runner@omukweyo.demo',
    password: demoPassword,
    destination: '/runner/work',
    description: 'Accept public-line jobs and submit proof updates.',
  },
  {
    role: 'Platform admin',
    name: 'Aina Admin',
    email: 'admin@omukweyo.demo',
    password: demoPassword,
    destination: '/admin',
    description: 'Role coverage, runner applications, and network health.',
  },
];

export function destinationForDemoEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return demoAccounts.find((account) => account.email === normalized)?.destination ?? '/dashboard';
}
