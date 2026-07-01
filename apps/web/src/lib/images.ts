import inlineCustomerHero from '@/assets/inline-customer-hero.png';
import inlineBusinessDashboard from '@/assets/inline-business-dashboard.png';
import inlineRunnerWorkflow from '@/assets/inline-runner-workflow.png';
import inlinePublicPage from '@/assets/inline-public-page.png';
import inlineOperationsDashboard from '@/assets/inline-operations-dashboard.png';
import inlineReservationFlow from '@/assets/inline-reservation-flow.png';

// Image helper. Core product visuals are project-owned generated assets;
// remaining category images are lightweight remote fallbacks for secondary cards.

export const img = {
  inlineCustomerHero,
  inlineBusinessDashboard,
  inlineRunnerWorkflow,
  inlinePublicPage,
  inlineOperationsDashboard,
  inlineReservationFlow,
  bankBranch: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=70&auto=format&fit=crop',
  bankLobby: 'https://images.unsplash.com/photo-1601597111158-18f680d1c043?w=900&q=70&auto=format&fit=crop',
  bankCounter: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=900&q=70&auto=format&fit=crop',
  clinicHall: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=70&auto=format&fit=crop',
  salonInterior: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=900&q=70&auto=format&fit=crop',
  personPhone: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=70&auto=format&fit=crop',
  personWaiting: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=70&auto=format&fit=crop',
  personCafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=70&auto=format&fit=crop',
  qrCoffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=70&auto=format&fit=crop',
  bookOpen: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=70&auto=format&fit=crop',
  qrPoster: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=70&auto=format&fit=crop',
  personAvatar1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&q=70&auto=format&fit=crop',
  personAvatar2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&q=70&auto=format&fit=crop',
  personAvatar3: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&q=70&auto=format&fit=crop',
  personAvatar4: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&q=70&auto=format&fit=crop',
  personAvatar5: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&q=70&auto=format&fit=crop',
  personAvatar6: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&q=70&auto=format&fit=crop',
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=70&auto=format&fit=crop',
  handPhone: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=70&auto=format&fit=crop',
  screenMock: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=70&auto=format&fit=crop',
  storeFront: 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=900&q=70&auto=format&fit=crop',
  government: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=900&q=70&auto=format&fit=crop',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=70&auto=format&fit=crop',
  school: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=70&auto=format&fit=crop',
  logo: (seed: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=F6F1E7&textColor=15110D`,
};

type StoreHeroInput = {
  heroImageUrl?: string;
  industry?: string;
  name?: string;
};

export function storeHeroForIndustry(input: StoreHeroInput) {
  if (input.heroImageUrl) return input.heroImageUrl;

  const haystack = `${input.industry ?? ''} ${input.name ?? ''}`.toLowerCase();
  if (/bank|finan|atm/.test(haystack)) return img.bankLobby;
  if (/clinic|doctor|health|pharma|hospital/.test(haystack)) return img.clinicHall;
  if (/salon|spa|repair|service/.test(haystack)) return img.salonInterior;
  if (/restaurant|cafe|food/.test(haystack)) return img.restaurant;
  if (/school|university|college|education/.test(haystack)) return img.school;
  if (/govern|ministry|municipal/.test(haystack)) return img.government;
  if (/shop|store|retail/.test(haystack)) return img.storeFront;
  return img.office;
}
