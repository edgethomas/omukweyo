import { z } from 'zod';

// ---------- auth ----------

export const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof LoginBody>;

// ---------- companies ----------

export const CompanySlug = z.object({ slug: z.string().min(1) });

export const BusinessOnboardingBody = z.object({
  ownerName: z.string().min(1).max(80),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  ownerPhone: z.string().min(7).max(20),
  companyName: z.string().min(1).max(100),
  industry: z.string().min(2).max(80),
  branchName: z.string().min(1).max(80),
  address: z.string().max(160).optional().or(z.literal('')),
  city: z.string().min(2).max(80),
  branchPhone: z.string().max(20).optional().or(z.literal('')),
  openingHours: z.string().min(2).max(80),
  serviceName: z.string().min(1).max(80),
  averageServiceMinutes: z.number().int().min(1).max(120),
  plan: z.enum(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']).default('FREE'),
});
export type BusinessOnboardingBody = z.infer<typeof BusinessOnboardingBody>;

export const BillingPaymentMethod = z.enum(['MOCK_CARD', 'MOCK_EFT', 'MOCK_INVOICE']);

export const UpdateSubscriptionBody = z.object({
  plan: z.enum(['FREE', 'STARTER', 'BUSINESS', 'ENTERPRISE']),
  paymentMethod: BillingPaymentMethod.default('MOCK_INVOICE'),
});
export type UpdateSubscriptionBody = z.infer<typeof UpdateSubscriptionBody>;

export const PurchaseSmsCreditsBody = z.object({
  packageId: z.enum(['STARTER', 'GROWTH', 'SCALE']),
  paymentMethod: BillingPaymentMethod.default('MOCK_CARD'),
});
export type PurchaseSmsCreditsBody = z.infer<typeof PurchaseSmsCreditsBody>;

// ---------- branches ----------

export const JoinQueueBody = z.object({
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(7).max(20),
  source: z.enum(['QR', 'PUBLIC_PAGE', 'EMBED', 'STAFF_WALK_IN', 'APPOINTMENT', 'RUNNER']).default('PUBLIC_PAGE'),
});
export type JoinQueueBody = z.infer<typeof JoinQueueBody>;

// ---------- customers + future reservations ----------

export const CustomerSignupBody = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});
export type CustomerSignupBody = z.infer<typeof CustomerSignupBody>;

export const CreateReservationBody = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(7).max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  branchId: z.string().min(1),
  serviceId: z.string().min(1),
  targetArrivalAt: z.string().datetime(),
  arrivalWindowMinutes: z.number().int().min(10).max(90).default(30),
  paymentMethod: z.enum(['MOCK_CARD', 'MOCK_EFT', 'MOCK_WALLET']).default('MOCK_CARD'),
});
export type CreateReservationBody = z.infer<typeof CreateReservationBody>;

export const ReservationParams = z.object({
  id: z.string().min(1),
});

// ---------- runners ----------

export const RunnerApplicationBody = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(7).max(20),
  city: z.string().min(2).max(80),
  transportMode: z.string().min(2).max(40),
  payoutMethod: z.string().min(2).max(40),
  canStartAt: z.string().min(2).max(120),
  notes: z.string().max(500).optional().or(z.literal('')),
});
export type RunnerApplicationBody = z.infer<typeof RunnerApplicationBody>;

// ---------- staff actions ----------

export const TicketActionBody = z.object({
  ticketId: z.string().min(1),
  counter: z.string().optional(),
});
export type TicketActionBody = z.infer<typeof TicketActionBody>;

export const CallNextBody = z.object({
  branchId: z.string().min(1),
  counter: z.string().optional(),
});

export const TransferBody = z.object({
  ticketId: z.string().min(1),
  toServiceId: z.string().min(1),
  actor: z.string().max(80).optional(),
});
export type TransferBody = z.infer<typeof TransferBody>;

export const StaffSmsBody = z.object({
  ticketId: z.string().min(1),
  message: z.string().min(1).max(320),
});
export type StaffSmsBody = z.infer<typeof StaffSmsBody>;

export const RunnerJobParams = z.object({
  id: z.string().min(1),
});

export const RunnerAcceptBody = z.object({
  runnerName: z.string().min(1).max(80).optional(),
});

export const RunnerProofBody = z.object({
  message: z.string().min(1).max(320),
});

export const CreateRunnerRequestBody = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).max(80),
  customerPhone: z.string().min(7).max(20),
  destinationName: z.string().min(1).max(120),
  destinationCity: z.string().min(2).max(80),
  destinationSource: z.string().max(40).optional(),
  serviceName: z.string().min(1).max(80),
  targetArrivalAt: z.string().datetime(),
  maxBudgetCents: z.number().int().min(2000).max(200000),
  instructions: z.string().min(1).max(500),
});
export type CreateRunnerRequestBody = z.infer<typeof CreateRunnerRequestBody>;
