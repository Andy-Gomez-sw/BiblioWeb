<?php
// ════════════════════════════════════════
//  revisar_documentos.php — "Examen" automático
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

$pdo = getDB();

try {
    // Buscar documentos pendientes con al menos 2 minutos de antigüedad
    $sql = "
        SELECT id, usuario_id, titulo, resumen, doi_isbn, area_conocimiento
        FROM documentos
        WHERE estado = 'pendiente'
        AND creado_en <= DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    ";
    $stmt = $pdo->query($sql);
    $candidatos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $aprobados = 0;

    foreach ($candidatos as $doc) {
        // ── "Examen" automático: validación básica de calidad ──
        $resumenValido = mb_strlen(trim($doc['resumen'])) >= 20;
        $tituloValido  = mb_strlen(trim($doc['titulo'])) >= 5;
        $areaValida    = !empty($doc['area_conocimiento']);

        $pasaExamen = $resumenValido && $tituloValido && $areaValida;

        if ($pasaExamen) {
            $up = $pdo->prepare("UPDATE documentos SET estado = 'publicado' WHERE id = :id");
            $up->execute([':id' => $doc['id']]);

            $mensaje = "Tu documento \"{$doc['titulo']}\" fue aprobado y ya está publicado en la colección.";

            $ins = $pdo->prepare("
                INSERT INTO notificaciones (usuario_id, documento_id, mensaje, leida, creado_en)
                VALUES (:uid, :did, :msg, 0, NOW())
            ");
            $ins->execute([
                ':uid' => $doc['usuario_id'],
                ':did' => $doc['id'],
                ':msg' => $mensaje
            ]);

            $aprobados++;
        }
    }

    responder(true, 'Revisión completada.', ['aprobados' => $aprobados]);

} catch (PDOException $e) {
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}