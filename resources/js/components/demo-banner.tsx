import { Clock, Download, Info, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface DemoBannerProps {
    timeUntilReset: {
        hours: number;
        minutes: number;
        seconds: number;
        expired: boolean;
    };
}

export function DemoBanner({ timeUntilReset: initialTime }: DemoBannerProps) {
    const [timeUntilReset, setTimeUntilReset] = useState(initialTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeUntilReset((prev) => {
                if (prev.expired) return prev;

                let newSeconds = prev.seconds - 1;
                let newMinutes = prev.minutes;
                let newHours = prev.hours;

                if (newSeconds < 0) {
                    newSeconds = 59;
                    newMinutes -= 1;
                }

                if (newMinutes < 0) {
                    newMinutes = 59;
                    newHours -= 1;
                }

                if (newHours < 0) {
                    return {
                        hours: 0,
                        minutes: 0,
                        seconds: 0,
                        expired: true,
                    };
                }

                return {
                    hours: newHours,
                    minutes: newMinutes,
                    seconds: newSeconds,
                    expired: false,
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const formatTime = (time: number): string => time.toString().padStart(2, '0');

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleDownloadCSV = () => {
        // Create the CSV content
        const csvContent = `Date,Description,Paid In,Paid Out,Balance
2025-08-01,PAYROLL DEPOSIT,3200.00,,5700.00
2025-08-02,SAFEWAY GROCERIES,,124.50,5575.50
2025-08-03,ELECTRIC BILL,,89.00,5486.50
2025-08-04,SHELL GAS STATION,,52.50,5434.00
2025-08-05,NETFLIX SUBSCRIPTION,,15.99,5418.01
2025-08-06,TRANSFER TO SAVINGS,,500.00,4918.01
2025-08-07,TRADER JOE'S MARKET,,87.75,4830.26
2025-08-08,PIZZA PALACE RESTAURANT,,28.50,4801.76
2025-08-09,ATM WITHDRAWAL,,100.00,4701.76
2025-08-10,WHOLE FOODS MARKET,,95.25,4606.51
2025-08-11,ONLINE TRANSFER,68.49,,4675.00
2025-08-12,STARBUCKS COFFEE,,5.50,4669.50
2025-08-13,INTERNET BILL,,75.00,4594.50
2025-08-14,KROGER GROCERIES,,112.30,4482.20
2025-08-15,MCDONALD'S BURGER,,12.75,4469.45
2025-08-16,SPOTIFY SUBSCRIPTION,,9.99,4459.46
2025-08-17,AMAZON PRIME,,119.00,4340.46
2025-08-18,CHEVRON GAS,,45.25,4295.21
2025-08-19,DISNEY+ SUBSCRIPTION,,7.99,4287.22
2025-08-20,WATER BILL,,65.50,4221.72`;

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'demo-sample-transactions.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    if (timeUntilReset.expired) {
        return (
            <div className="border-b bg-red-50 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-red-800">
                        <RotateCcw className="h-4 w-4" />
                        <span className="font-medium">Demo data has expired and will be reset on next action.</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleRefresh} className="text-red-700 border-red-200 hover:bg-red-100">
                        Refresh Now
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="border-b bg-orange-50 px-4 py-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-orange-800">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">Demo Mode:</span>
                    <span>This is sample data that resets every 24 hours. Your changes won't be permanently saved.</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownloadCSV}
                        className="text-orange-700 border-orange-200 hover:bg-orange-100"
                    >
                        <Download className="h-3 w-3 mr-1" />
                        Sample CSV
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">
                            {formatTime(timeUntilReset.hours)}:{formatTime(timeUntilReset.minutes)}:{formatTime(timeUntilReset.seconds)}
                        </span>
                        <span className="text-xs">until reset</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 