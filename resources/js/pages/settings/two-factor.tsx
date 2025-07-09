import { Head, useForm, usePage } from '@inertiajs/react';
import { LoaderCircle, Shield, ShieldCheck, ShieldOff, AlertTriangle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import OtpInput from 'react-otp-input';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';

interface TwoFactorProps {
    user: {
        id: number;
        name: string;
        email: string;
        two_factor_confirmed_at: string | null;
    };
    qrCodeUrl?: string;
    secretKey?: string;
    recoveryCodes?: string[];
}

export default function TwoFactor({ user, qrCodeUrl, secretKey, recoveryCodes }: TwoFactorProps) {
    const { flash } = usePage().props as any;
    const [code, setCode] = useState('');
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

    const enableForm = useForm({
        code: '',
    });

    const disableForm = useForm({
        password: '',
    });

    const confirmForm = useForm({
        code: '',
    });

    const regenerateForm = useForm({});

    const hasTwoFactorEnabled = !!user.two_factor_confirmed_at;

    const enableTwoFactor: FormEventHandler = (e) => {
        e.preventDefault();
        enableForm.post('/user/two-factor-authentication');
    };

    const confirmTwoFactor: FormEventHandler = (e) => {
        e.preventDefault();
        confirmForm.transform((data) => ({
            ...data,
            code: code,
        }));
        confirmForm.post('/user/confirmed-two-factor-authentication', {
            onSuccess: () => {
                setCode('');
                setShowRecoveryCodes(true);
            },
        });
    };

    const disableTwoFactor: FormEventHandler = (e) => {
        e.preventDefault();
        disableForm.delete('/user/two-factor-authentication', {
            onSuccess: () => {
                setShowRecoveryCodes(false);
            },
        });
    };

    const regenerateRecoveryCodes: FormEventHandler = (e) => {
        e.preventDefault();
        regenerateForm.post('/user/two-factor-recovery-codes');
    };

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto p-6">
                <Head title="Two-Factor Authentication" />

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground">
                            Add additional security to your account using two-factor authentication.
                        </p>
                    </div>

                    <Separator />

                    {/* Flash Messages */}
                    {flash.message && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{flash.message}</AlertDescription>
                        </Alert>
                    )}

                    {/* 2FA Required Warning */}
                    {!hasTwoFactorEnabled && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Two-Factor Authentication Required:</strong> You must enable two-factor authentication to access other parts of the application.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-6">
                        {/* Current Status */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {hasTwoFactorEnabled ? (
                                        <ShieldCheck className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <ShieldOff className="h-5 w-5 text-gray-400" />
                                    )}
                                    <div>
                                        <CardTitle className="text-base">
                                            {hasTwoFactorEnabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled'}
                                        </CardTitle>
                                        <CardDescription>
                                            {hasTwoFactorEnabled
                                                ? 'Two-factor authentication is currently enabled for your account.'
                                                : 'Two-factor authentication is not enabled for your account.'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Enable 2FA */}
                        {!hasTwoFactorEnabled && !qrCodeUrl && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Enable Two-Factor Authentication
                                    </CardTitle>
                                    <CardDescription>
                                        When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's Google Authenticator application.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={enableTwoFactor}>
                                        <Button type="submit" disabled={enableForm.processing}>
                                            {enableForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Enable Two-Factor Authentication
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* Setup 2FA (QR Code and Confirmation) */}
                        {qrCodeUrl && !hasTwoFactorEnabled && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Finish enabling two-factor authentication</CardTitle>
                                        <CardDescription>
                                            To finish enabling two-factor authentication, scan the following QR code using your phone's authenticator application or enter the setup key and provide the generated OTP code.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* QR Code */}
                                        <div className="flex justify-center">
                                            <div className="p-4 bg-white rounded-lg border">
                                                <QRCodeSVG value={qrCodeUrl} size={200} />
                                            </div>
                                        </div>

                                        {/* Setup Key */}
                                        {secretKey && (
                                            <div className="space-y-2">
                                                <Label>Setup Key</Label>
                                                <Input value={secretKey} readOnly className="font-mono text-sm" />
                                                <p className="text-xs text-muted-foreground">
                                                    Store this setup key in a password manager in case you need to set up your authenticator app again.
                                                </p>
                                            </div>
                                        )}

                                        {/* Confirmation Form */}
                                        <form onSubmit={confirmTwoFactor} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Code</Label>
                                                <div className="flex justify-center">
                                                    <OtpInput
                                                        value={code}
                                                        onChange={setCode}
                                                        numInputs={6}
                                                        renderInput={(props) => <input {...props} />}
                                                        inputStyle={{
                                                            width: '40px',
                                                            height: '40px',
                                                            margin: '0 4px',
                                                            fontSize: '16px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #d1d5db',
                                                            textAlign: 'center',
                                                        }}
                                                    />
                                                </div>
                                                {confirmForm.errors.code && (
                                                    <p className="text-sm text-red-600">{confirmForm.errors.code}</p>
                                                )}
                                            </div>

                                            <Button type="submit" disabled={confirmForm.processing || code.length !== 6}>
                                                {confirmForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Confirm Two-Factor Authentication
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Recovery Codes */}
                        {(showRecoveryCodes || (hasTwoFactorEnabled && recoveryCodes)) && recoveryCodes && recoveryCodes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recovery Codes</CardTitle>
                                    <CardDescription>
                                        Store these recovery codes in a secure password manager. They can be used to recover access to your account if your two-factor authentication device is lost.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-lg border">
                                        {recoveryCodes.map((code, index) => (
                                            <div key={index} className="font-mono text-sm text-gray-800 text-center py-1 px-2 bg-white rounded border">
                                                {code}
                                            </div>
                                        ))}
                                    </div>

                                    {hasTwoFactorEnabled && (
                                        <form onSubmit={regenerateRecoveryCodes}>
                                            <Button type="submit" variant="outline" disabled={regenerateForm.processing}>
                                                {regenerateForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Regenerate Recovery Codes
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Disable 2FA */}
                        {hasTwoFactorEnabled && (
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Disable Two-Factor Authentication</CardTitle>
                                    <CardDescription>
                                        When two-factor authentication is disabled, you will only be prompted for your password during authentication.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={disableTwoFactor} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={disableForm.data.password}
                                                onChange={(e) => disableForm.setData('password', e.target.value)}
                                                required
                                            />
                                            {disableForm.errors.password && (
                                                <p className="text-sm text-red-600">{disableForm.errors.password}</p>
                                            )}
                                        </div>

                                        <Button type="submit" variant="destructive" disabled={disableForm.processing}>
                                            {disableForm.processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                            Disable Two-Factor Authentication
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 