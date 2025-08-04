import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { DemoBanner } from '@/components/demo-banner';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { isDemoUser, demoTimeUntilReset } = usePage().props as any;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {isDemoUser && <DemoBanner timeUntilReset={demoTimeUntilReset} />}
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main className="flex-1 px-6 py-6 md:px-4">{children}</main>
            </AppContent>
        </AppShell>
    );
}
