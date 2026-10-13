<?php
// Allow CORS so your frontend can communicate with this script
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

// Get JSON body sent from frontend
$input = json_decode(file_get_contents('php://input'), true);

$phone = $input['phone'] ?? '';
$amount = $input['amount'] ?? 0;
$accountReference = $input['account_reference'] ?? 'Dalmiq Comm';

if (empty($phone) || empty($amount)) {
    http_response_code(400);
    echo json_encode(["message" => "Phone number and amount are required."]);
    exit;
}

// --- Daraja API Configuration ---
// (Replace these sandbox values with your live credentials when moving to production)
$consumerKey = "your_consumer_key_here";
$consumerSecret = "your_consumer_secret_here";
$businessShortCode = "0702614447"; // Your Buy Goods Till Number
$passkey = "your_daraja_lipa_na_mpesa_online_passkey";
$callbackUrl = "https://yourdomain.com/api/callback.php";

// 1. Generate Access Token
$credentials = base64_encode($consumerKey . ':' . $consumerSecret);
$tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . $credentials]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$tokenResponse = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(["message" => "Curl error fetching token: " . $curlError]);
    exit;
}

$tokenData = json_decode($tokenResponse, true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    http_response_code(500);
    echo json_encode(["message" => "Failed to generate M-PESA access token", "details" => $tokenData]);
    exit;
}

// 2. Prepare STK Push Request
$timestamp = date('YmdHis');
$password = base64_encode($businessShortCode . $passkey . $timestamp);
$stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

$stkPayload = [
    "BusinessShortCode" => $businessShortCode,
    "Password" => $password,
    "Timestamp" => $timestamp,
    "TransactionType" => "CustomerBuyGoodsOnline", // Used for Buy Goods Till Numbers
    "Amount" => (int)$amount,
    "PartyA" => $phone,
    "PartyB" => $businessShortCode,
    "PhoneNumber" => $phone,
    "CallBackURL" => $callbackUrl,
    "AccountReference" => $accountReference,
    "TransactionDesc" => "Payment for Dalmiq Communications order"
];

$ch = curl_init($stkUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($stkPayload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$stkResponse = curl_exec($ch);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(500);
    echo json_encode(["message" => "Curl error sending STK push: " . $curlError]);
    exit;
}

// Return Safaricom's response back to the frontend
http_response_code(200);
echo $stkResponse;
?>