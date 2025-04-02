<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityData extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'steps',
        'distance_km',
        'active_minutes',
    ];


    protected $casts = [
        'date' => 'date',
        'steps' => 'integer',
        'distance_km' => 'float',
        'active_minutes' => 'integer',
    ];


    public function user(): BelongsTo{
        return $this->belongsTo(User::class);
    }
}
