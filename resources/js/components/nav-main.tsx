import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    const isActive = (href: string) => {
        // Exact match for most routes
        if (page.url === href) {
            return true;
        }

        // Special handling for routes that should match child paths
        // But exclude specific child routes that have their own nav items
        if (href === '/imports' && page.url.startsWith('/imports')) {
            // Don't highlight "Imports" when on "Import Statement" (/imports/create)
            return page.url === '/imports';
        }

        // For other routes, use startsWith but exclude exact matches handled above
        return page.url.startsWith(href) && page.url !== href;
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={{ children: item.title }}
                            data-sidebar-item={item.title}
                            className="transition-all duration-200"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
