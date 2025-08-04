<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_demo',
        'demo_last_reset',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_demo' => 'boolean',
            'demo_last_reset' => 'datetime',
        ];
    }

    /**
     * Get the accounts for the user.
     */
    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Get the CSV schemas for the user.
     */
    public function csvSchemas(): HasMany
    {
        return $this->hasMany(CsvSchema::class);
    }

    /**
     * Get the imports for the user.
     */
    public function imports(): HasMany
    {
        return $this->hasMany(Import::class);
    }

    /**
     * Get the transactions for the user.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the tags for the user.
     */
    public function tags(): HasMany
    {
        return $this->hasMany(Tag::class);
    }

    /**
     * Scope to get demo users only.
     */
    public function scopeDemo($query)
    {
        return $query->where('is_demo', true);
    }

    /**
     * Scope to get non-demo users only.
     */
    public function scopeNonDemo($query)
    {
        return $query->where('is_demo', false);
    }

    /**
     * Check if the user is a demo user.
     */
    public function isDemoUser(): bool
    {
        return $this->is_demo;
    }
}
