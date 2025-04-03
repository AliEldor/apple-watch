<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ActivityDataController;
use App\Http\Controllers\ActivityPredictionController;

Route::group(["prefix" => "v0.1"], function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::group(["prefix" => "activity"] , function(){
        // activity data routes

            Route::post('/upload', [ActivityDataController::class, 'uploadActivityData']);
            Route::get('/', [ActivityDataController::class, 'getUserActivityData']);
            Route::get('/date/{date}', [ActivityDataController::class, 'getActivityByDate']);
            Route::get('/daily-trends', [ActivityDataController::class, 'getDailyTrends']);
            Route::get('/weekly-trends', [ActivityDataController::class, 'getWeeklyTrends']);
            Route::get('/summary', [ActivityDataController::class, 'getActivitySummary']);

            
            });
            // predictions

            Route::group(["prefix" => "predictions"], function() {
                Route::post('/generate', [ActivityPredictionController::class, 'generatePredictions']);
                Route::get('/', [ActivityPredictionController::class, 'getUserPredictions']);
            });

        Route::post('/logout', [AuthController::class, 'logout']);
    });
});