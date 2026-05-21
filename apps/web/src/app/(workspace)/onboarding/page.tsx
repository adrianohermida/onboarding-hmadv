import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = { title: 'Onboarding' };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: caso } = await supabase
    .from('portal_casos')
    .select('*')
    .eq('user_id', user?.id ?? '')
    .maybeSingle();

  if (!caso) redirect('/dashboard');
  if (caso.onboarding_done) redirect('/dashboard');

  return <OnboardingWizard caso={caso} userId={user!.id} />;
}
