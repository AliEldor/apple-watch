<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Exception;
use GuzzleHttp\Psr7\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                "success" => false,
                "message" => "validation error",
                "errors" => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'full_name' => $request->full_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            "success" => true,
            "message" => "User registered successfully",
            "user" => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                "success" => false,
                "message" => "missing attribute",
                "errors" => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                "success" => false,
                "error" => "Email or Password Incorrect"
            ], 401);
        }

        try{
            $tokenResult = $user->createToken('auth-token');
            $token = $tokenResult->accessToken;
            
            return response()->json([
                "success" => true,
                "user" => $user,
                "token" => $token,
            ]);
        }
        catch(Exception $e){
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ]);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        
        return response()->json([
            "success" => true,
            "message" => "Logged out successfully"
        ]);
    }


    // get authenticated user
    public function user(Request $request)
    {
        return response()->json([
            "success" => true,
            "user" => $request->user()
        ]);
    }
}