import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/forms/settings-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: investors }] = await Promise.all([
    supabase.from('app_settings').select('*').single(),
    supabase.from('investors').select('*').order('account_type').order('name'),
  ]);

  return (
    <div className="space-y-6 animate-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage business info, investors, and account configuration
        </p>
      </div>
      <SettingsForm settings={settings!} investors={investors ?? []} />
    </div>
  );
}
