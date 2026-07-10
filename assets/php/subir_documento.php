<?php
// ════════════════════════════════════════
//  subir_documento.php 
// ════════════════════════════════════════

require_once __DIR__ . '/../../../config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

define('UPLOAD_DIR', __DIR__ . '/uploads/documentos/');
define('UPLOAD_URL', 'https://bibliowebb.com.mx/uploads/documentos/');

function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

// Validar que el ID del usuario no venga vacío
$usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
if ($usuario_id <= 0) {
    responder(false, 'Error: Sesión de usuario inválida.');
}

// Validar campos obligatorios
$campos = ['titulo', 'autor', 'anio', 'institucion', 'area', 'doi', 'resumen', 'tipo', 'acceso'];
foreach ($campos as $c) {
    if (!isset($_POST[$c]) || trim($_POST[$c]) === '') {
        responder(false, "El campo '$c' es obligatorio.");
    }
}

$titulo      = trim($_POST['titulo']);
$autor       = trim($_POST['autor']);
$anio        = (int) $_POST['anio'];
$institucion = trim($_POST['institucion']); 
$area        = trim($_POST['area']);
$doi         = trim($_POST['doi']);
$resumen     = trim($_POST['resumen']);
$tipo        = trim($_POST['tipo']);
$acceso      = trim($_POST['acceso']);

if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    responder(false, 'Archivo no recibido o dañado en la transferencia.');
}

$archivo    = $_FILES['archivo'];
$ext        = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
$permitidos = ['pdf', 'docx'];

if (!in_array($ext, $permitidos)) {
    responder(false, 'Solo se permiten extensiones PDF o DOCX.');
}
if ($archivo['size'] > 50 * 1024 * 1024) {
    responder(false, 'El archivo excede el tamaño máximo de 50 MB.');
}

if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

$nombreArchivo = uniqid('doc_', true) . '.' . $ext;
$rutaFinal     = UPLOAD_DIR . $nombreArchivo;
$urlFinal      = UPLOAD_URL . $nombreArchivo;

if (!move_uploaded_file($archivo['tmp_name'], $rutaFinal)) {
    responder(false, 'Error del sistema de archivos al guardar en Hostinger.');
}

$tamanoLegible = round($archivo['size'] / (1024 * 1024), 1) . ' MB';

$pdo = getDB();

try {
    // Ajustado exactamente al orden y nombres de tu tabla física de MySQL
    $sql = "
        INSERT INTO documentos
            (usuario_id, tipo, titulo, autor, anio_publicacion, institucion_editorial, 
             area_conocimiento, doi_isbn, resumen, acceso, ruta_pdf, tamano_archivo, estado, creado_en)
        VALUES
            (:usuario_id, :tipo, :titulo, :autor, :anio_publicacion, :institucion_editorial, 
             :area_conocimiento, :doi_isbn, :resumen, :acceso, :ruta_pdf, :tamano_archivo, 'pendiente', NOW())
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':usuario_id'            => $usuario_id,
        ':tipo'                  => $tipo,
        ':titulo'                => $titulo,
        ':autor'                 => $autor,
        ':anio_publicacion'      => $anio,
        ':institucion_editorial' => $institucion,
        ':area_conocimiento'     => $area,
        ':doi_isbn'              => $doi,
        ':resumen'               => $resumen,
        ':acceso'                => $acceso,
        ':ruta_pdf'              => $urlFinal,
        ':tamano_archivo'        => $tamanoLegible
    ]);

    // ID del documento recién insertado — lo necesitamos para las palabras clave
    $documento_id = (int) $pdo->lastInsertId();

    // ── GUARDAR PALABRAS CLAVE (tabla separada) ──
    if (isset($_POST['palabras_clave']) && trim($_POST['palabras_clave']) !== '') {
        $tagsRaw   = $_POST['palabras_clave'];
        $tagsArray = array_map('trim', explode(',', $tagsRaw));
        $tagsArray = array_filter($tagsArray, fn($t) => $t !== '');

        $stmtTag = $pdo->prepare("INSERT INTO palabras_clave (documento_id, palabra) VALUES (:documento_id, :palabra)");

        foreach ($tagsArray as $palabra) {
            $stmtTag->execute([
                ':documento_id' => $documento_id,
                ':palabra'      => $palabra
            ]);
        }
    }

    responder(true, 'Documento subido correctamente.', [
        'id'          => $documento_id,
        'url_archivo' => $urlFinal,
        'titulo'      => $titulo,
    ]);

} catch (PDOException $e) {
    @unlink($rutaFinal);
    
    responder(false, 'Error en Query de Base de Datos: ' . $e->getMessage());
}