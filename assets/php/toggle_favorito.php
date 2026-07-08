<?php
// ════════════════════════════════════════
//  toggle_favorito.php
// ════════════════════════════════════════

require_once __DIR__ . '/../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

$usuario_id   = isset($_POST['usuario_id']) ? (int) $_POST['usuario_id'] : 0;
$documento_id = isset($_POST['documento_id']) ? (int) $_POST['documento_id'] : 0;

if ($usuario_id <= 0 || $documento_id <= 0) {
    responder(false, 'Datos inválidos.');
}

$pdo = getDB();

try {
    $stmt = $pdo->prepare("SELECT usuario_id FROM favoritos WHERE usuario_id = :uid AND documento_id = :did");
    $stmt->execute([':uid' => $usuario_id, ':did' => $documento_id]);
    $existe = $stmt->fetch();

    if ($existe) {
        // Ya era favorito → lo quitamos
        $del = $pdo->prepare("DELETE FROM favoritos WHERE usuario_id = :uid AND documento_id = :did");
        $del->execute([':uid' => $usuario_id, ':did' => $documento_id]);
        responder(true, 'Eliminado de favoritos.', ['es_favorito' => false]);
    } else {
        // No era favorito → lo agregamos
        $ins = $pdo->prepare("INSERT INTO favoritos (usuario_id, documento_id, agregado_en) VALUES (:uid, :did, NOW())");
        $ins->execute([':uid' => $usuario_id, ':did' => $documento_id]);
        responder(true, 'Agregado a favoritos.', ['es_favorito' => true]);
    }

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}