'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Wallet,
  Receipt,
  BarChart3,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-rule bg-paper-2 hidden lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-rule px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-accent">
          <Building2 className="h-5 w-5 text-paper" />
        </div>
        <div>
          <p className="font-display font-semibold text-lg text-ink leading-tight">
            Ahmad Traders
          </p>
          <p className="text-xs text-ink-3">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                   href={href}
                   className={cn(
                     'flex items-center gap-3 py-2.5 text-[14.4px] font-medium transition-all duration-150 border-l-2',
                     isActive
                       ? 'border-accent pl-2.5 text-ink font-semibold'
                       : 'border-transparent pl-2.5 text-ink-2 hover:text-ink'
                   )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent" : "text-ink-3")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-rule p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-ink-3 hover:text-ink hover:bg-paper/40"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-ink-3" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
