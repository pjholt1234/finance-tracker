import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TagSelect } from '@/components/ui/tag-select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/utils/constants';
import { buildApiParams } from '@/utils/form-helpers';
import { Account, Tag, Transaction } from '@/types/global';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardData {
    accounts: Account[];
    tags: Tag[];
    stats: {
        income: number;
        outgoings: number;
        totalBalance: number;
    };
    tagBreakdown: Array<{
        tag: string;
        income: number;
        outgoings: number;
    }>;
    balanceOverTime: Array<{
        date: string;
        balance: number;
    }>;
}

interface Filters {
    accountIds: number[];
    dateRange: { from: Date | null; to: Date | null };
    tagIds: number[];
}

export default function Dashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({
        accountIds: [],
        dateRange: { from: null, to: null },
        tagIds: [],
    });

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const params = buildApiParams({
                account_ids: filters.accountIds,
                date_from: filters.dateRange.from,
                date_to: filters.dateRange.to,
                tag_ids: filters.tagIds,
            });

            const response = await api.get(`${API_ENDPOINTS.DASHBOARD}?${params.toString()}`);
            setData(response.data);
        } catch (error) {
            // Don't set data to null on error, keep previous data if available
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboardData();
    }, [filters]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (loading && !data) {
        return (
            <AppLayout>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl">
                    <div className="text-center">Loading dashboard...</div>
                </div>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl">
                    <div className="text-center text-red-600">Failed to load dashboard data</div>
                    <div className="text-center mt-4">
                        <Button onClick={fetchDashboardData}>Retry</Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl relative">
                {loading && data && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <div className="mt-2 text-sm text-gray-600">Updating...</div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Track your financial overview and insights</p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Account Filter */}
                            <div className="space-y-2">
                                <Label>Account</Label>
                                <Select
                                    value={filters.accountIds.length > 0 ? filters.accountIds[0].toString() : 'all'}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({
                                            ...prev,
                                            accountIds: value && value !== 'all' ? [parseInt(value)] : []
                                        }));
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All accounts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All accounts</SelectItem>
                                        {data.accounts.map((account) => (
                                            <SelectItem key={account.id} value={account.id.toString()}>
                                                {account.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <Label>Date Range</Label>
                                <DateRangePicker
                                    from={filters.dateRange.from}
                                    to={filters.dateRange.to}
                                    onSelect={(range: { from: Date | null; to: Date | null }) => {
                                        setFilters(prev => ({
                                            ...prev,
                                            dateRange: range
                                        }));
                                    }}
                                />
                            </div>

                            {/* Tags Filter */}
                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <TagSelect
                                    tags={data.tags}
                                    selectedTags={data.tags.filter(tag => filters.tagIds.includes(tag.id))}
                                    onTagsChange={(selectedTags) => {
                                        setFilters(prev => ({
                                            ...prev,
                                            tagIds: selectedTags.map(tag => tag.id)
                                        }));
                                    }}
                                    placeholder="Filter by tags"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Income</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(data.stats.income)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Outgoings</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(data.stats.outgoings)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(data.stats.totalBalance)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tag Breakdown Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Income & Outgoings by Tag</CardTitle>
                            <CardDescription>Breakdown of transactions by tag</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.tagBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="tag" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelFormatter={(label: string) => `Tag: ${label}`}
                                    />
                                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                                    <Bar dataKey="outgoings" fill="#ef4444" name="Outgoings" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Balance Over Time Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Balance Over Time</CardTitle>
                            <CardDescription>Account balance trends</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={data.balanceOverTime}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelFormatter={(label: string) => `Date: ${label}`}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        name="Balance"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
