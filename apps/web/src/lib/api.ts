const BASE = '/api';

const SESSION_KEY = 'omukweyo_session';

function authToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw)?.token as string | undefined : undefined;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = authToken();
  const isForm = init.body instanceof FormData;
  const headers: HeadersInit = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    throw new Error(body?.message || `${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ ok: boolean; tickets: number; notifications: number }>('/health'),
  login: (body: { email: string; password: string }) =>
    request<{ session: any; user: any }>(`/auth/login`, { method: 'POST', body: JSON.stringify(body) }),
  me: (token: string) =>
    request<{ user: any }>(`/auth/me`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }),
  logout: (token: string) =>
    request<{ ok: boolean }>(`/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }),
  businesses: (query = '') => request<{ businesses: any[] }>(`/businesses${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`),
  company: (slug: string) => request<any>(`/company/${slug}`),
  businessOnboard: (body: {
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerPhone: string;
    companyName: string;
    industry: string;
    branchName: string;
    address?: string;
    city: string;
    branchPhone?: string;
    openingHours: string;
    serviceName: string;
    averageServiceMinutes: number;
    plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE';
  }) => request<{ onboarding: any; session?: any; user?: any }>(`/business/onboard`, { method: 'POST', body: JSON.stringify(body) }),
  businessWidget: () => request<any>(`/business/widget`),
  businessProfile: (body: {
    name?: string;
    industry?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoText?: string;
    logoUrl?: string;
    heroImageUrl?: string;
    tagline?: string;
    websiteUrl?: string;
    publicDescription?: string;
  }) => request<{ company: any }>(`/business/profile`, { method: 'PATCH', body: JSON.stringify(body) }),
  businessUploadAsset: (file: File, type: 'logo' | 'hero') => {
    const form = new FormData();
    form.set('asset', file);
    form.set('type', type);
    return request<{ asset: any; company: any }>(`/business/assets`, { method: 'POST', body: form });
  },
  createBranch: (body: { name: string; address?: string; city?: string; phone?: string; openingHours?: string; avgWaitMin?: number }) =>
    request<{ branch: any }>(`/business/branches`, { method: 'POST', body: JSON.stringify(body) }),
  createService: (body: { name: string; description?: string; branchId?: string; averageServiceMinutes?: number; icon?: string }) =>
    request<{ service: any }>(`/business/services`, { method: 'POST', body: JSON.stringify(body) }),
  inviteStaff: (body: { name: string; email: string; branchId?: string; role?: string; counter?: string }) =>
    request<{ staff: any; invite: any }>(`/business/staff`, { method: 'POST', body: JSON.stringify(body) }),
  billingOverview: () => request<any>(`/billing/overview`),
  updateSubscription: (body: { plan: 'FREE' | 'STARTER' | 'BUSINESS' | 'ENTERPRISE'; paymentMethod: 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_INVOICE' }) =>
    request<{ subscription: any; billing: any }>(`/billing/subscription`, { method: 'POST', body: JSON.stringify(body) }),
  purchaseSmsCredits: (body: { packageId: 'STARTER' | 'GROWTH' | 'SCALE'; paymentMethod: 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_INVOICE' }) =>
    request<{ purchase: any; billing: any }>(`/billing/sms-credits`, { method: 'POST', body: JSON.stringify(body) }),
  branch: (slug: string, companySlug?: string) => request<any>(`/branch/${slug}${companySlug ? `?company=${encodeURIComponent(companySlug)}` : ''}`),
  liveQueue: (branchId?: string) => request<{ tickets: any[] }>(`/queue/live${branchId ? `?branchId=${branchId}` : ''}`),
  joinQueue: (body: { branchId: string; serviceId: string; customerName: string; customerPhone: string; source?: 'QR' | 'PUBLIC_PAGE' | 'EMBED' | 'STAFF_WALK_IN' | 'APPOINTMENT' | 'RUNNER' }) =>
    request<{ ticket: any }>(`/queue/join`, { method: 'POST', body: JSON.stringify(body) }),
  customerSignup: (body: { name: string; phone: string; email?: string; password?: string }) =>
    request<{ customer: any; session?: any; user?: any }>(`/customers/signup`, { method: 'POST', body: JSON.stringify(body) }),
  customerUploadAvatar: (customerId: string, file: File) => {
    const form = new FormData();
    form.set('avatar', file);
    return request<{ customer: any }>(`/customers/${customerId}/avatar`, { method: 'POST', body: form });
  },
  deleteCustomer: (customerId: string) =>
    request<{ deleted: boolean; customer: any }>(`/customers/${customerId}`, { method: 'DELETE' }),
  forgotPassword: (email: string) =>
    request<{ ok: boolean; mode: string; message: string }>(`/auth/forgot-password`, { method: 'POST', body: JSON.stringify({ email }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ ok: boolean; mode?: string; message?: string }>(`/auth/change-password`, { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  customerReservations: (customerId: string) => request<{ customer: any; reservations: any[] }>(`/customers/${customerId}/reservations`),
  customerVisit: (customerId: string) => request<{ customer: any; reservations: any[]; currentTicket?: any; notifications: any[] }>(`/customers/${customerId}/visit`),
  customerHistory: (customerId: string) => request<{ customer: any; tickets: any[]; reservations: any[] }>(`/customers/${customerId}/history`),
  createReservation: (body: {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    branchId: string;
    serviceId: string;
    targetArrivalAt: string;
    arrivalWindowMinutes: number;
    paymentMethod: 'MOCK_CARD' | 'MOCK_EFT' | 'MOCK_WALLET';
  }) => request<{ reservation: any }>(`/reservations`, { method: 'POST', body: JSON.stringify(body) }),
  getReservation: (id: string) => request<{ reservation: any; ticket?: any }>(`/reservations/${id}`),
  bookReservationNow: (id: string) =>
    request<{ reservation: any; ticket: any }>(`/reservations/${id}/book-now`, { method: 'POST' }),
  runnerApply: (body: {
    name: string;
    email: string;
    password: string;
    phone: string;
    city: string;
    transportMode: string;
    payoutMethod: string;
    canStartAt: string;
    notes?: string;
  }) => request<{ application: any; session?: any; user?: any }>(`/runners/apply`, { method: 'POST', body: JSON.stringify(body) }),
  setRunnerApplicationStatus: (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') =>
    request<{ application: any }>(`/runners/applications/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  runnerJobs: () => request<{ jobs: any[] }>(`/runners/jobs`),
  runnerAcceptJob: (id: string, runnerName?: string) =>
    request<{ job: any; jobs: any[] }>(`/runners/jobs/${id}/accept`, { method: 'POST', body: JSON.stringify({ runnerName }) }),
  runnerCheckIn: (id: string) =>
    request<{ job: any; notification: any; jobs: any[] }>(`/runners/jobs/${id}/check-in`, { method: 'POST' }),
  runnerProof: (id: string, message: string) =>
    request<{ job: any; notification: any; jobs: any[] }>(`/runners/jobs/${id}/proof`, { method: 'POST', body: JSON.stringify({ message }) }),
  runnerComplete: (id: string) =>
    request<{ job: any; notification: any; jobs: any[] }>(`/runners/jobs/${id}/complete`, { method: 'POST' }),
  runnerRequest: (body: {
    customerName: string;
    customerPhone: string;
    destinationName: string;
    destinationCity: string;
    destinationSource?: string;
    serviceName: string;
    targetArrivalAt: string;
    maxBudgetCents: number;
    instructions: string;
  }) => request<{ request: any }>(`/runner-requests`, { method: 'POST', body: JSON.stringify(body) }),
  runnerRequestById: (id: string) => request<{ request: any }>(`/runner-requests/${id}`),
  customerRunnerRequests: (customerId: string) => request<{ requests: any[] }>(`/customers/${customerId}/runner-requests`),
  searchDestinations: (q: string, city?: string) => request<{ results: any[]; source: string }>(`/destinations/search?q=${encodeURIComponent(q)}${city ? `&city=${encodeURIComponent(city)}` : ''}`),
  adminOverview: () => request<any>(`/admin/overview`),
  getTicket: (id: string) => request<{ ticket: any }>(`/ticket/${id}`),
  cancelTicket: (id: string) => request<{ ticket: any }>(`/ticket/${id}/cancel`, { method: 'POST' }),
  onMyWay: (id: string) => request<{ ticket: any }>(`/ticket/${id}/on-my-way`, { method: 'POST' }),
  staffCallNext: (branchId: string, counter?: string) =>
    request<{ ticket: any }>(`/staff/call-next`, { method: 'POST', body: JSON.stringify({ branchId, counter }) }),
  staffServe: (ticketId: string) => request<{ ticket: any }>(`/staff/serve`, { method: 'POST', body: JSON.stringify({ ticketId }) }),
  staffServed: (ticketId: string) => request<{ ticket: any }>(`/staff/served`, { method: 'POST', body: JSON.stringify({ ticketId }) }),
  staffMissed: (ticketId: string) => request<{ ticket: any }>(`/staff/missed`, { method: 'POST', body: JSON.stringify({ ticketId }) }),
  staffHold: (ticketId: string) => request<{ ticket: any }>(`/staff/hold`, { method: 'POST', body: JSON.stringify({ ticketId }) }),
  staffTransfer: (ticketId: string, toServiceId: string, actor = 'Counter 3') =>
    request<{ ticket: any }>(`/staff/transfer`, { method: 'POST', body: JSON.stringify({ ticketId, toServiceId, actor }) }),
  staffSendSms: (ticketId: string, message: string) =>
    request<{ notification: any; ticket: any }>(`/staff/send-sms`, { method: 'POST', body: JSON.stringify({ ticketId, message }) }),
  dashboard: (companySlug?: string) => request<any>(`/dashboard${companySlug ? `?company=${encodeURIComponent(companySlug)}` : ''}`),
  notifications: () => request<{ notifications: any[] }>(`/notifications`),
};
