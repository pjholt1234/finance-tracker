import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableTable } from '@/components/ui/sortable-table';
import { TagSelect } from '@/components/ui/tag-select';
import AppLayout from '@/layouts/app-layout';
import { api } from '@/lib/api';
import { Account, Tag } from '@/types/global';
import { API_ENDPOINTS } from '@/utils/constants';
import { buildApiParams } from '@/utils/form-helpers';
import { Head } from '@inertiajs/react';
import { Calendar, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

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
        net: number;
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
    const fetchDashboardData = useCallback(async () => {
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
        } catch {
            // Don't set data to null on error, keep previous data if available
        } finally {
            setLoading(false);
        }
    }, [filters.accountIds, filters.dateRange.from, filters.dateRange.to, filters.tagIds]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (loading && !data) {
        return (
            <>
                <AppLayout>
                    <Head title="Dashboard" />
                </AppLayout>
                <LoadingOverlay message="Loading dashboard..." />
            </>
        );
    }

    if (!data) {
        return (
            <AppLayout>
                <Head title="Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl">
                    <div className="text-center text-red-600">Failed to load dashboard data</div>
                    <div className="mt-4 text-center">
                        <Button onClick={fetchDashboardData}>Retry</Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <>
            <AppLayout>
                <Head title="Dashboard" />

                <div className="relative flex h-full flex-1 flex-col gap-4 rounded-xl">
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
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* Account Filter */}
                                <div className="space-y-2">
                                    <Label>Account</Label>
                                    <Select
                                        value={filters.accountIds.length > 0 ? filters.accountIds[0].toString() : 'all'}
                                        onValueChange={(value) => {
                                            setFilters((prev) => ({
                                                ...prev,
                                                accountIds: value && value !== 'all' ? [parseInt(value)] : [],
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
                                            setFilters((prev) => ({
                                                ...prev,
                                                dateRange: range,
                                            }));
                                        }}
                                    />
                                </div>

                                {/* Tags Filter */}
                                <div className="space-y-2">
                                    <Label>Tags</Label>
                                    <TagSelect
                                        tags={data.tags}
                                        selectedTags={data.tags.filter((tag) => filters.tagIds.includes(tag.id))}
                                        onTagsChange={(selectedTags) => {
                                            setFilters((prev) => ({
                                                ...prev,
                                                tagIds: selectedTags.map((tag) => tag.id),
                                            }));
                                        }}
                                        placeholder="Filter by tags"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Income</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(data.stats.income)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outgoings</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{formatCurrency(data.stats.outgoings)}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                                <DollarSign className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.stats.totalBalance)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts and Table Row */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Tag Breakdown Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Net Amount by Tag</CardTitle>
                                <CardDescription>Net income/outgoings breakdown by tag</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.tagBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="tag" />
                                        <YAxis />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                                                            <p className="font-medium text-gray-900">{`Tag: ${label}`}</p>
                                                            <p className="text-green-600">{`Income: ${formatCurrency(data.income)}`}</p>
                                                            <p className="text-red-600">{`Outgoings: ${formatCurrency(data.outgoings)}`}</p>
                                                            <p className={`font-bold ${data.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {`Net: ${formatCurrency(data.net)}`}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="net"
                                            name="Net Amount"
                                        >
                                            {data.tagBreakdown.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.net >= 0 ? "#22c55e" : "#ef4444"}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Tag Breakdown Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Breakdown Table</CardTitle>
                                <CardDescription>Detailed breakdown of income, outgoings, and net amounts by tag</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <SortableTable
                                    data={data.tagBreakdown}
                                    columns={[
                                        {
                                            key: 'tag',
                                            label: 'Tag',
                                            sortable: true,
                                        },
                                        {
                                            key: 'income',
                                            label: 'Income',
                                            sortable: true,
                                            render: (value: number) => (
                                                <span className="text-green-600">{formatCurrency(value)}</span>
                                            ),
                                        },
                                        {
                                            key: 'outgoings',
                                            label: 'Outgoings',
                                            sortable: true,
                                            render: (value: number) => (
                                                <span className="text-red-600">{formatCurrency(value)}</span>
                                            ),
                                        },
                                        {
                                            key: 'net',
                                            label: 'Net',
                                            sortable: true,
                                            render: (value: number) => (
                                                <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {formatCurrency(value)}
                                                </span>
                                            ),
                                        },
                                    ]}
                                    defaultSort={{ key: 'net', direction: 'desc' }}
                                />
                            </CardContent>
                        </Card>
                    </div>

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
                                    <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="Balance" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
            {loading && data && <LoadingOverlay message="Updating dashboard..." />}
        </>
    );
}
