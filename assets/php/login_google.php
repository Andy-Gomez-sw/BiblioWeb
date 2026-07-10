<?php
require_once __DIR__ . '/../../../config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

// ── CONEXION A BD ──
$pdo = getDB();

$json  = file_get_contents('php://input');
$datos = json_decode($json, true);

$email       = $datos['email']  ?? null;
$nombre      = $datos['nombre'] ?? null;
$avatar      = $datos['avatar'] ?? null;
$generoInput = $datos['genero'] ?? 'M'; // ← Capturamos el género que predice el JavaScript

if (!$email) {
    echo json_encode(["error" => "Falta el correo electrónico."]);
    http_response_code(400); exit();
}

try {
    // ── Traemos el registro si ya existe ──
    $stmt = $pdo->prepare("SELECT id, nombre, genero FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$usuario) {
        // CORRECCIÓN: Agregamos la variable $generoInput y emparejamos los 4 marcadores correspondientes (?, ?, ?, ?)
        $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, genero, email, password, avatar_url, metodo) VALUES (?, ?, ?, NULL, ?, 'google')");
        $stmt->execute([$nombre, $generoInput, $email, $avatar]);

        $usuario_id     = $pdo->lastInsertId();
        $nombre_usuario = $nombre;
        $genero         = $generoInput;
    } else {
        $usuario_id     = $usuario['id'];
        $nombre_usuario = $usuario['nombre'];
        // Si en la base de datos ya tenía un género guardado, respetamos ese
        $genero         = !empty($usuario['genero']) ? $usuario['genero'] : $generoInput;
    }

    echo json_encode([
        "mensaje"    => "Usuario autenticado con éxito",
        "usuario_id" => $usuario_id,
        "nombre"     => $nombre_usuario,
        "genero"     => $genero   
    ]);
    http_response_code(200);

} catch (Exception $e) {
    echo json_encode(["error" => "Error: " . $e->getMessage()]);
    http_response_code(500);
}
?>