import { Head, useForm, router } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import OtpInput from 'react-otp-input';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function TwoFactorChallenge() {
    const [code, setCode] = useState('');
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const { data, setData } = useForm({
        code: '',
        recovery_code: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (useRecoveryCode) {
            router.post('/two-factor-challenge', {
                recovery_code: data.recovery_code,
            }, {
                onFinish: () => setProcessing(false),
                onError: (errors) => setErrors(errors),
            });
        } else {
            router.post('/two-factor-challenge', {
                code: code,
            }, {
                onFinish: () => setProcessing(false),
                onError: (errors) => setErrors(errors),
            });
        }
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication"
            description={
                useRecoveryCode
                    ? "Please confirm access to your account by entering one of your emergency recovery codes."
                    : "Please confirm access to your account by entering the authentication code provided by your authenticator application."
            }
        >
            <Head title="Two-Factor Challenge" />

            <form onSubmit={submit} className="space-y-6">
                {!useRecoveryCode ? (
                    <div className="space-y-2">
                        <Label>Authentication Code</Label>
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
                        {errors.code && <p className="text-sm text-red-600">{errors.code}</p>}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="recovery_code">Recovery Code</Label>
                        <Input
                            id="recovery_code"
                            type="text"
                            value={data.recovery_code}
                            onChange={(e) => setData('recovery_code', e.target.value)}
                            placeholder="Enter recovery code"
                            autoComplete="one-time-code"
                            className="text-center"
                            required
                        />
                        {errors.recovery_code && <p className="text-sm text-red-600">{errors.recovery_code}</p>}
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={processing || (!useRecoveryCode && code.length !== 6)}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Log in
                </Button>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setUseRecoveryCode(!useRecoveryCode);
                            setCode('');
                            setData('recovery_code', '');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-500 underline"
                    >
                        {useRecoveryCode ? 'Use authentication code' : 'Use recovery code'}
                    </button>
                </div>

                <TextLink href={route('login')} className="block text-center text-sm">
                    ← Back to login
                </TextLink>
            </form>
        </AuthLayout>
    );
} 