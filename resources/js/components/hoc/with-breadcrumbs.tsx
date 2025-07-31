import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

export const withBreadcrumbs = <P extends object>(Component: React.ComponentType<P>, breadcrumbs: BreadcrumbItem[], title: string) => {
    return (props: P) => (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Component {...props} />
        </AppLayout>
    );
};
