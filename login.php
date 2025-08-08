<?php
session_start();

// Configuration
$VALID_USERNAME = "hakim2025";
$VALID_PASSWORD = "admin123";

// Lire les données JSON envoyées depuis JavaScript
$data = json_decode(file_get_contents("php://input"), true);

// Vérifier les champs
if (!isset($data['username']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode(["error" => "Champs manquants."]);
    exit;
}

// Vérification des identifiants
if ($data['username'] === $VALID_USERNAME && $data['password'] === $VALID_PASSWORD) {
    // Génération d'un token simple
    $token = bin2hex(random_bytes(32));
    $_SESSION['admin_token'] = $token;
    $_SESSION['admin_user'] = $VALID_USERNAME;

    echo json_encode([
        "success" => true,
        "token" => $token,
        "message" => "Connexion réussie."
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Nom d'utilisateur ou mot de passe incorrect."]);
}
?>