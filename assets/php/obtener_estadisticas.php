<?php
// ════════════════════════════════════════
//  obtener_estadisticas.php
// ════════════════════════════════════════

require_once __DIR__ . '/../../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$usuario_id = isset($_GET['usuario_id']) ? (int) $_GET['usuario_id'] : 0;
if ($usuario_id <= 0) {
    responder(false, 'Error: Sesión de usuario inválida.');
}

$pdo = getDB();

try {
    $stmt1 = $pdo->prepare("SELECT COUNT(*) FROM documentos WHERE usuario_id = :id");
    $stmt1->execute([':id' => $usuario_id]);
    $subidos = (int) $stmt1->fetchColumn();

    $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM favoritos WHERE usuario_id = :id");
    $stmt2->execute([':id' => $usuario_id]);
    $favoritos = (int) $stmt2->fetchColumn();

    $stmt3 = $pdo->prepare("SELECT COUNT(DISTINCT documento_id) FROM historial_consultas WHERE usuario_id = :id");
    $stmt3->execute([':id' => $usuario_id]);
    $consultados = (int) $stmt3->fetchColumn();

    responder(true, 'OK', [
        'subidos'     => $subidos,
        'favoritos'   => $favoritos,
        'consultados' => $consultados
    ]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}