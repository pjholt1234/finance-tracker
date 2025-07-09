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
        
        // Safely get secret key with error handling
        $secretKey = null;
        if ($user->two_factor_secret) {
            try {
                $secretKey = decrypt($user->two_factor_secret);
            } catch (\Exception $e) {
                // If decryption fails, we'll generate a new secret when user enables 2FA
                $secretKey = null;
            }
        }
        
        // Get QR code URL instead of SVG to avoid length issues
        $qrCodeUrl = null;
        if (!$user->two_factor_confirmed_at) {
            try {
                $qrCodeUrl = $user->twoFactorQrCodeUrl();
            } catch (\Exception $e) {
                // If QR generation fails, it will be regenerated when user enables 2FA
                $qrCodeUrl = null;
            }
        }
        
        // Safely get recovery codes with error handling
        $recoveryCodes = null;
        if ($user->two_factor_confirmed_at) {
            try {
                $recoveryCodes = $user->recoveryCodes();
                // Ensure we have valid recovery codes
                if (empty($recoveryCodes)) {
                    // If no recovery codes exist, generate them
                    $user->generateRecoveryCodes();
                    $recoveryCodes = $user->recoveryCodes();
                }
            } catch (\Exception $e) {
                // Recovery codes will be regenerated if needed
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