'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = ((formData.get('email') as string) || '').trim();
  const password = ((formData.get('password') as string) || '').trim();

  if (!email || !password) {
    return { success: false, error: 'Wprowadź adres e-mail i hasło.' };
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (error || !authData.user) {
    return { success: false, error: 'Błędny email lub hasło.' };
  }

  // Pobranie profilu po ID użytkownika z auth.users
  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  // Zabezpieczenie: jeśli ID w profiles jeszcze się różni, szukamy po emailu
  if (!profile && authData.user.email) {
    const fallbackRes = await supabase
      .from('profiles')
      .select('role')
      .eq('email', authData.user.email)
      .maybeSingle();
    profile = fallbackRes.data;
  }

  const redirectTo =
    profile?.role === 'coordinator'
      ? '/koordynator'
      : profile?.role === 'club_admin' || profile?.role === 'master_admin'
        ? '/admin'
        : '/trener';

  return { success: true, redirectTo };
}

export const signInAction = loginAction;

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getSessionContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;

  let { data: profile } = await supabase
    .from('profiles')
    .select('club_id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile && user.email) {
    const fallback = await supabase
      .from('profiles')
      .select('club_id, role, full_name')
      .eq('email', user.email)
      .maybeSingle();
    profile = fallback.data;
  }

  if (profile) {
    return {
      userId: user.id,
      clubId: profile.club_id,
      role: profile.role,
      name: profile.full_name || 'Użytkownik',
    };
  }

  return null;
}