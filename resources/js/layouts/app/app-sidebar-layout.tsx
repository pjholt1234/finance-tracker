import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { DemoBanner } from '@/components/demo-banner';
import { DemoTour } from '@/components/demo-tour';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren, useState, useEffect } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { isDemoUser, demoTimeUntilReset } = usePage().props as any;
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        // Show tour for demo users when they first land on the dashboard
        if (isDemoUser && window.location.pathname === '/dashboard') {
            // Check if this is a fresh login (no tour shown yet this session)
            const hasShownTour = sessionStorage.getItem('demo-tour-shown');
            if (!hasShownTour) {
                // Small delay to ensure the page is fully loaded and sidebar is rendered
                const timer = setTimeout(() => {
                    setShowTour(true);
                    sessionStorage.setItem('demo-tour-shown', 'true');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [isDemoUser]);

    const handleCloseTour = () => {
        setShowTour(false);
    };

    const handleStartTour = () => {
        setShowTour(true);
    };

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                {isDemoUser && (
                    <DemoBanner
                        timeUntilReset={demoTimeUntilReset}
                        onStartTour={handleStartTour}
                    />
                )}
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <main className="flex-1 px-6 py-6 md:px-4">{children}</main>
            </AppContent>

            {/* Demo Tour Modal */}
            {isDemoUser && (
                <DemoTour
                    isOpen={showTour}
                    onClose={handleCloseTour}
                />
            )}
        </AppShell>
    );
}
