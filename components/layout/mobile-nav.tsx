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
  BarChart3,
} from 'lucide-react';

const mobileNavItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-rule bg-paper-2/95 backdrop-blur-md lg:hidden safe-area-inset-bottom">
      <ul className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'text-accent'
                    : 'text-ink-3 hover:text-ink'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-150',
                    isActive && 'scale-110'
                  )}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
