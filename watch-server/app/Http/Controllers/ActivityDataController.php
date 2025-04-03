<?php

namespace App\Http\Controllers;

use App\Models\ActivityData;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;


class ActivityDataController extends Controller
{

    // proces the watch data
    public function uploadActivityData(Request $request)
    {
        set_time_limit(120); // allow 2min for processing
        
        $validator = Validator::make($request->all(), [
            'csv_file' => 'required|string', 
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userId = Auth::id();
            
            // Remove old data first
            ActivityData::where('user_id', $userId)->delete();
            
            // Decode the base64 string
            $base64Data = $request->csv_file;
            $csvContent = base64_decode($base64Data);
            
            if (!$csvContent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid base64 data'
                ], 422);
            }

            // split into rows
            $rows = explode("\n", $csvContent);
            
            // header row
            $headers = str_getcsv(array_shift($rows));
            
            // create mapping of expected columns
            $columnMap = [];
            foreach ($headers as $index => $header) {
                $columnMap[trim($header)] = $index;
            }
            
            $neededFields = ['user_id', 'date', 'steps', 'distance_km', 'active_minutes'];
            
            // verify is firlds are available
            $missingFields = [];
            foreach ($neededFields as $field) {
                if (!array_key_exists($field, $columnMap)) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                return response()->json([
                    'success' => false,
                    'message' => 'CSV is missing the following columns: ' . implode(', ', $missingFields)
                ], 422);
            }
            
            $successful = 0;
            $errors = 0;
            
            // prepare for batch processing
            $batchSize = 100;
            $recordBatch = [];
            
            foreach ($rows as $index => $row) {
                $row = trim($row);
                if (empty($row)) continue;
                
                // parse the CSV row
                $values = str_getcsv($row);
                
                // Skip if column count doesn't match
                if (count($values) !== count($headers)) {
                    $errors++;
                    continue;
                }
                
                // convert row to associative array
                $rowData = [];
                foreach ($headers as $colIndex => $header) {
                    $rowData[$header] = $values[$colIndex] ?? null;
                }
                

                if (empty($rowData['date']) || !isset($rowData['steps']) || 
                    !isset($rowData['distance_km']) || !isset($rowData['active_minutes']) ||
                    !isset($rowData['user_id'])) {
                    $errors++;
                    continue;
                }
                
                // add to batch
                $recordBatch[] = [
                    'user_id' => $userId,
                    'date' => $rowData['date'],
                    'steps' => (int) $rowData['steps'],
                    'distance_km' => (float) $rowData['distance_km'],
                    'active_minutes' => (int) $rowData['active_minutes'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                
                // Process batch if full or last row
                if (count($recordBatch) >= $batchSize || $index === count($rows) - 1) {
                    try {
                        // Insert all 
                        ActivityData::insert($recordBatch);
                        $successful += count($recordBatch);
                    } catch (\Exception $e) {
                        // incase of error try one by one
                        foreach ($recordBatch as $record) {
                            try {
                                ActivityData::create($record);
                                $successful++;
                            } catch (\Exception $inner) {
                                $errors++;
                                Log::error('Failed to insert record: ' . $inner->getMessage());
                            }
                        }
                    }
                    
                    
                    $recordBatch = [];
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Activity data processed successfully',
                'stats' => [
                    'processed' => $successful,
                    'failed' => $errors
                ],
                'user_id' => $userId
            ]);
            
        } catch (\Exception $e) {
            Log::error('CSV Processing Error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to process activity data: ' . $e->getMessage(),
            ], 500);
        }

    }


    public function getUserActivityData(Request $request)
    {
        $userId = Auth::id();
        $itemsPerPage = $request->input('per_page', 20);
        
        $query = ActivityData::where('user_id', $userId);
        
        //  date filters if provided
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }
        
        // If searching for a specific metric range
        if ($request->has('metric') && $request->has('min_value')) {
            $metric = $request->metric;
            if (in_array($metric, ['steps', 'distance_km', 'active_minutes'])) {
                $query->where($metric, '>=', $request->min_value);
            }
        }
        
        if ($request->has('metric') && $request->has('max_value')) {
            $metric = $request->metric;
            if (in_array($metric, ['steps', 'distance_km', 'active_minutes'])) {
                $query->where($metric, '<=', $request->max_value);
            }
        }

        // Fetch data with pagination
        $activities = $query->orderBy('date', 'asc')->paginate($itemsPerPage);
        
        return response()->json([
            'success' => true,
            'data' => $activities
        ]);
    }


    public function getActivityByDate(Request $request, $date)
    {
        $userId = Auth::id();
        
        // validate date format
        $validator = Validator::make(['date' => $date], [
            'date' => 'required|date_format:Y-m-d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Date must be in YYYY-MM-DD format',
            ], 422);
        }
        
        // activity record
        $activity = ActivityData::where('user_id', $userId)
            ->where('date', $date)
            ->first();
            
        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'No activity found for this date',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $activity
        ]);
    }



    public function getDailyTrends(Request $request)
    {
        $userId = Auth::id();
        
        $days = $request->input('days', 30);
        if ($days > 90) $days = 90;
        
        $activities = ActivityData::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->take($days)
            ->get(['date', 'steps', 'distance_km', 'active_minutes']);
        
        $activities = $activities->sortBy('date')->values();
        
        $chartData = [];
        foreach ($activities as $activity) {
            $chartData[] = [
                'date' => $activity->date->format('Y-m-d'),
                'steps' => $activity->steps,
                'distance' => $activity->distance_km,
                'activeMinutes' => $activity->active_minutes,
            ];
        }
        
       
        $avgSteps = round($activities->avg('steps'));
        $avgDistance = round($activities->avg('distance_km'), 2);
        $avgActiveMinutes = round($activities->avg('active_minutes'));
        
        return response()->json([
            'success' => true,
            'data' => $chartData,
            'count' => count($chartData),
            'requested_days' => $days,
            'averages' => [
                'steps' => $avgSteps,
                'distance' => $avgDistance,
                'activeMinutes' => $avgActiveMinutes
            ]
        ]);
    }



    public function getWeeklyTrends(Request $request)
    {
        $userId = Auth::id();
        $weeks = $request->input('weeks', 4);
        
        if ($weeks > 52) {
            $weeks = 52;
        }
        
        $activities = ActivityData::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->get(['date', 'steps', 'distance_km', 'active_minutes']);
        
        
        $weeklyData = [];
        foreach ($activities as $activity) {
            //  week start date
            $weekStart = Carbon::parse($activity->date)->startOfWeek()->format('Y-m-d');
            
            if (!isset($weeklyData[$weekStart])) {
                
                if (count($weeklyData) >= $weeks) {
                    continue;
                }
                
                $weekEnd = Carbon::parse($activity->date)->endOfWeek()->format('Y-m-d');
                $weeklyData[$weekStart] = [
                    'weekStart' => $weekStart,
                    'weekEnd' => $weekEnd,
                    'totalSteps' => 0,
                    'totalDistance' => 0,
                    'totalActiveMinutes' => 0,
                    'daysTracked' => 0,
                ];
            }
            
            // add activity data to week totals
            $weeklyData[$weekStart]['totalSteps'] += $activity->steps;
            $weeklyData[$weekStart]['totalDistance'] += $activity->distance_km;
            $weeklyData[$weekStart]['totalActiveMinutes'] += $activity->active_minutes;
            $weeklyData[$weekStart]['daysTracked']++;
        }
        
        
        $result = [];
        foreach ($weeklyData as $week) {
            $daysTracked = max(1, $week['daysTracked']); // Avoid division by zero
            
            $result[] = [
                'weekStart' => $week['weekStart'],
                'weekEnd' => $week['weekEnd'],
                'weekLabel' => $week['weekStart'] . ' to ' . $week['weekEnd'],
                'totalSteps' => $week['totalSteps'],
                'totalDistance' => round($week['totalDistance'], 2),
                'totalActiveMinutes' => $week['totalActiveMinutes'],
                'avgSteps' => round($week['totalSteps'] / $daysTracked),
                'avgDistance' => round($week['totalDistance'] / $daysTracked, 2),
                'avgActiveMinutes' => round($week['totalActiveMinutes'] / $daysTracked),
                'daysTracked' => $week['daysTracked']
            ];
        }
        
        // Sort by date
        usort($result, function ($a, $b) {
            return strtotime($a['weekStart']) - strtotime($b['weekStart']);
        });
        
        return response()->json([
            'success' => true,
            'data' => $result,
            'count' => count($result),
            'requested_weeks' => $weeks
        ]);
    }


    public function getActivitySummary()
    {
        $userId = Auth::id();
        
        //  todays activity
        $today = now()->format('Y-m-d');
        $todayActivity = ActivityData::where('user_id', $userId)
            ->where('date', $today)
            ->first();
        
        // yesterdays activity
        $yesterday = now()->subDay()->format('Y-m-d');
        $yesterdayActivity = ActivityData::where('user_id', $userId)
            ->where('date', $yesterday)
            ->first();
        
        // last week
        $weekStart = now()->subDays(7)->format('Y-m-d');
        $weeklyActivities = ActivityData::where('user_id', $userId)
            ->where('date', '>=', $weekStart)
            ->where('date', '<', $today)
            ->get();
        
        //  weekly average
        $weeklyAvg = [
            'steps' => $weeklyActivities->avg('steps') ?? 0,
            'distance_km' => $weeklyActivities->avg('distance_km') ?? 0,
            'active_minutes' => $weeklyActivities->avg('active_minutes') ?? 0
        ];
        
        $allTimeStats = ActivityData::where('user_id', $userId)
            ->selectRaw('
                MAX(steps) as max_steps, 
                AVG(steps) as avg_steps, 
                MAX(active_minutes) as max_active_minutes, 
                AVG(active_minutes) as avg_active_minutes,
                MAX(distance_km) as max_distance,
                AVG(distance_km) as avg_distance,
                COUNT(*) as total_days_tracked
            ')
            ->first();
        
        // calculate activity streak
        $activityDates = ActivityData::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->get(['date'])
            ->map(function ($item) {
                return $item->date->format('Y-m-d');
            })
            ->toArray();
        
        $streak = 0;
        $date = now();
        
        //  consecutive days with activity data
        while (in_array($date->format('Y-m-d'), $activityDates)) {
            $streak++;
            $date->subDay();
        }
        
        return response()->json([
            'success' => true,
            'today' => $todayActivity,
            'yesterday' => $yesterdayActivity,
            'weekly_average' => [
                'steps' => round($weeklyAvg['steps']),
                'distance' => round($weeklyAvg['distance_km'], 2),
                'active_minutes' => round($weeklyAvg['active_minutes'])
            ],
            'all_time' => [
                'max_steps' => $allTimeStats ? round($allTimeStats->max_steps) : 0,
                'avg_steps' => $allTimeStats ? round($allTimeStats->avg_steps) : 0,
                'max_active_minutes' => $allTimeStats ? round($allTimeStats->max_active_minutes) : 0,
                'avg_active_minutes' => $allTimeStats ? round($allTimeStats->avg_active_minutes) : 0,
                'max_distance' => $allTimeStats ? round($allTimeStats->max_distance, 2) : 0,
                'avg_distance' => $allTimeStats ? round($allTimeStats->avg_distance, 2) : 0,
                'total_days_tracked' => $allTimeStats ? $allTimeStats->total_days_tracked : 0
            ],
            'current_streak' => $streak
        ]);
    }
}
