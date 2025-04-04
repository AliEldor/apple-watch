<?php

namespace App\Http\Controllers;

use App\Models\ActivityData;
use App\Models\ActivityPrediction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ActivityPredictionController extends Controller
{

    public function getUserPredictions(Request $request)
    {
        $userId = Auth::id();
        $type = $request->input('type');
        
        $query = ActivityPrediction::where('user_id', $userId);
        
        if ($type && in_array($type, ['GOAL_PREDICTION', 'ANOMALY', 'TREND', 'INSIGHT'])) {
            $query->where('prediction_type', $type);
        }
        
        $predictions = $query->orderBy('date', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $predictions
        ]);
    }

    public function generatePredictions(Request $request)
    {
        $userId = Auth::id();
        
        try {
            // get user activity data
            $activityData = ActivityData::where('user_id', $userId)
                ->orderBy('date', 'asc')
                ->get();
                
            if ($activityData->count() < 7) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not enough data to generate predictions. Please upload at least 7 days of activity data.'
                ], 400);
            }
            
            
            ActivityPrediction::where('user_id', $userId)->delete();
            
            $predictions = $this->generateGeminiPredictions($userId, $activityData);
            
            if (empty($predictions)) {
                // execute simpler predictions if api fails
                $this->generateBasicPredictions($userId, $activityData);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Predictions generated successfully',
                'count' => ActivityPrediction::where('user_id', $userId)->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Prediction generation failed: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate predictions: ' . $e->getMessage()
            ], 500);
        }
    }


    private function generateBasicPredictions($userId, $activityData)
    {
        // calculate averages
        $avgSteps = $activityData->avg('steps');
        $avgActiveMinutes = $activityData->avg('active_minutes');
        
        // goal prediction
        $stepGoal = 10000;
        $minuteGoal = 30;
        
        $goalText = "Based on your average of " . round($avgSteps) . " steps per day, ";
        if ($avgSteps >= $stepGoal) {
            $goalText .= "you're consistently meeting the recommended 10,000 daily steps goal. Keep up the good work!";
        } else {
            $stepsNeeded = $stepGoal - $avgSteps;
            $goalText .= "you need about " . round($stepsNeeded) . " more steps daily to reach the recommended 10,000 steps.";
        }
        
        ActivityPrediction::create([
            'user_id' => $userId,
            'date' => now(),
            'prediction_type' => 'GOAL_PREDICTION',
            'prediction_text' => $goalText
        ]);
        
        // active minutes prediction
        $minutesText = "Your average active minutes is " . round($avgActiveMinutes) . " per day. ";
        if ($avgActiveMinutes >= $minuteGoal) {
            $minutesText .= "You're meeting the recommended 30 minutes of daily activity. Excellent!";
        } else {
            $minutesText .= "Try to increase your active time by " . round($minuteGoal - $avgActiveMinutes) . " minutes to meet the recommended 30 minutes daily.";
        }
        
        ActivityPrediction::create([
            'user_id' => $userId,
            'date' => now(),
            'prediction_type' => 'GOAL_PREDICTION',
            'prediction_text' => $minutesText
        ]);
        
        // trend 
        $recentData = $activityData->sortByDesc('date')->take(7);
        $recentAvg = $recentData->avg('steps');
        
        $trendText = "Based on your recent activity, ";
        if ($recentAvg > $avgSteps * 1.1) {
            $trendText .= "you're trending upward in your step count. This is a positive direction!";
        } elseif ($recentAvg < $avgSteps * 0.9) {
            $trendText .= "your recent step count has decreased. Try to get back to your usual activity level.";
        } else {
            $trendText .= "your activity level has been consistent. Maintaining this consistency is great for your health.";
        }
        
        ActivityPrediction::create([
            'user_id' => $userId,
            'date' => now(),
            'prediction_type' => 'TREND',
            'prediction_text' => $trendText
        ]);
        
        //  insight
        $insightText = "Consider setting a specific time each day for physical activity to help establish a consistent routine.";
        
        ActivityPrediction::create([
            'user_id' => $userId,
            'date' => now(),
            'prediction_type' => 'INSIGHT',
            'prediction_text' => $insightText
        ]);
    }


    private function formatDataForAI($activityData)
    {
        $formattedData = [];
        
        foreach ($activityData as $record) {
            $formattedData[] = [
                'date' => $record->date->format('Y-m-d'),
                'day_of_week' => $record->date->format('l'),
                'steps' => $record->steps,
                'distance_km' => $record->distance_km,
                'active_minutes' => $record->active_minutes
            ];
        }
        
        return $formattedData;
    }
    
    
    private function createGeminiPrompt($formattedData)
    {
        // basic statistics 
        $totalRecords = count($formattedData);
        $avgSteps = array_sum(array_column($formattedData, 'steps')) / $totalRecords;
        $avgActiveMinutes = array_sum(array_column($formattedData, 'active_minutes')) / $totalRecords;
        
        $prompt = "You are a health data analyst specializing in Apple Watch activity data. ";
        $prompt .= "Analyze the following activity data and provide insights:\n\n";
        $prompt .= "User activity data summary:\n";
        $prompt .= "- Number of days tracked: $totalRecords\n";
        $prompt .= "- Average daily steps: " . round($avgSteps) . "\n";
        $prompt .= "- Average active minutes: " . round($avgActiveMinutes) . "\n\n";
        
        $prompt .= "Please provide the following four types of predictions, clearly labeled with the type:\n";
        $prompt .= "1. GOAL_PREDICTION: Assess if the user is likely to meet standard health goals (10,000 steps, 30 active minutes) based on their patterns\n";
        $prompt .= "2. ANOMALY: Identify any days where activity deviates significantly from the user's normal pattern\n";
        $prompt .= "3. TREND: Project future activity trends for the next 7 days\n";
        $prompt .= "4. INSIGHT: Suggest 2-3 actionable insights to help the user optimize their health goals\n\n";
        
        // Add the actusal  data (limit 30 bcz of tokens)
        $recentData = array_slice($formattedData, -30);
        $prompt .= "Recent activity data:\n";
        foreach ($recentData as $record) {
            $prompt .= "{$record['date']} ({$record['day_of_week']}): {$record['steps']} steps, {$record['active_minutes']} active minutes, {$record['distance_km']} km\n";
        }
        
        $prompt .= "\nFormat your response with prediction types as headers and predictions as bullet points.";
        
        return $prompt;
    }


    private function generateGeminiPredictions($userId, $activityData)
    {
        try {
        
            $formattedData = $this->formatDataForAI($activityData);
            
            // create prompt for Gemini
            $prompt = $this->createGeminiPrompt($formattedData);
            
            $apiKey = env('GEMINI_API_KEY');
            $endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent";
            
            $response = Http::withOptions([
                'verify' => false, // Disable SSL verification
            ])->withHeaders([
                'Content-Type' => 'application/json',
            ])->post($endpoint . '?key=' . $apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.2,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ]
            ]);
            
            if ($response->successful()) {
                return $this->processGeminiResponse($response->json(), $userId);
            } else {
                Log::error('Gemini API error: ' . $response->body());
                return [];
            }
        } catch (\Exception $e) {
            Log::error('Error with Gemini AI: ' . $e->getMessage());
            return [];
        }
    }


    private function processGeminiResponse($aiResponse, $userId)
    {
        $storedPredictions = [];
    
    // Extract the text from the response
    if (isset($aiResponse['candidates'][0]['content']['parts'][0]['text'])) {
        $responseText = $aiResponse['candidates'][0]['content']['parts'][0]['text'];
        
        $predictionTypes = ['GOAL_PREDICTION', 'ANOMALY', 'TREND', 'INSIGHT'];
        
        foreach ($predictionTypes as $type) {
            if (strpos($responseText, $type) !== false) {
                $startPos = strpos($responseText, $type);
                $endPos = false;
                
                foreach ($predictionTypes as $nextType) {
                    if ($nextType != $type) {
                        $nextPos = strpos($responseText, $nextType, $startPos + strlen($type));
                        if ($nextPos !== false && ($endPos === false || $nextPos < $endPos)) {
                            $endPos = $nextPos;
                        }
                    }
                }
                
                if ($endPos === false) {
                    $endPos = strlen($responseText);
                }
                
                $sectionText = substr($responseText, $startPos + strlen($type), $endPos - $startPos - strlen($type));
                $sectionText = trim($sectionText, ": \n\t");
                
                
                $cleanText = $this->cleanPredictionText($sectionText);
                
                if (!empty($cleanText)) {
                    $prediction = ActivityPrediction::create([
                        'user_id' => $userId,
                        'date' => now(),
                        'prediction_type' => $type,
                        'prediction_text' => $cleanText
                    ]);
                    
                    $storedPredictions[] = $prediction;
                }
            }
        }
    }
    
    return $storedPredictions;
}


private function cleanPredictionText($text)
{
    $charsToRemove = ['*', ':', '•', '-'];
    
    // Remove athe above charss
    $text = str_replace($charsToRemove, '', $text);
    
    // Trim 
    return trim(preg_replace('/\s+/', ' ', $text));
}
}
