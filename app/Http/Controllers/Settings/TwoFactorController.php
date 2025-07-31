<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorController extends Controller
{
    /**
     * Show the two-factor authentication settings page.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        $secretKey = null;
        if ($user->two_factor_secret) {
            try {
                $secretKey = decrypt($user->two_factor_secret);
            } catch (\Exception $e) {
                $secretKey = null;
            }
        }

        $qrCodeUrl = null;
        if (! $user->two_factor_confirmed_at) {
            try {
                $qrCodeUrl = $user->twoFactorQrCodeUrl();
            } catch (\Exception $e) {
                $qrCodeUrl = null;
            }
        }

        $recoveryCodes = null;
        if ($user->two_factor_confirmed_at) {
            try {
                $recoveryCodes = $user->recoveryCodes();
                if (empty($recoveryCodes)) {
                    $user->generateRecoveryCodes();
                    $recoveryCodes = $user->recoveryCodes();
                }
            } catch (\Exception $e) {
                $recoveryCodes = [];
            }
        }

        return Inertia::render('settings/two-factor', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
            ],
            'qrCodeUrl' => $qrCodeUrl,
            'secretKey' => $secretKey,
            'recoveryCodes' => $recoveryCodes,
        ]);
    }
}
