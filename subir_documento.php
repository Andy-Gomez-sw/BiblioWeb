<?php
// ════════════════════════════════════════
//  subir_documento.php — Biblioweb
//  Usa config.php para la conexión MySQL
// ════════════════════════════════════════

require_once __DIR__ . '/../config.php'; // Ajusta la ruta si config.php está en otro lugar

// ── CORS ──
header('Access-Control-Allow-Origin: https://bibliowebb.com.mx');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Solo POST ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// ════════════════════════════════════════
//  CARPETA DE ARCHIVOS
// ════════════════════════════════════════
define('UPLOAD_DIR', __DIR__ . '/../uploads/documentos/');
define('UPLOAD_URL', 'https://bibliowebb.com.mx/uploads/documentos/');

// ════════════════════════════════════════
//  FUNCIÓN RESPUESTA JSON
// ════════════════════════════════════════
function responder(bool $ok, string $msg, array $extra = []): void {
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}

// ════════════════════════════════════════
//  VALIDAR CAMPOS
// ════════════════════════════════════════
$campos = ['titulo', 'autor', 'anio', 'institucion', 'area', 'doi', 'resumen', 'tipo', 'acceso'];
foreach ($campos as $c) {
    if (empty(trim($_POST[$c] ?? ''))) {
        responder(false, "El campo '$c' es obligatorio.");
    }
}

$titulo         = trim($_POST['titulo']);
$autor          = trim($_POST['autor']);
$anio           = (int) $_POST['anio'];
$institucion    = trim($_POST['institucion']);
$area           = trim($_POST['area']);
$doi            = trim($_POST['doi']);
$resumen        = trim($_POST['resumen']);
$tipo           = trim($_POST['tipo']);
$acceso         = trim($_POST['acceso']);
$palabras_clave = trim($_POST['palabras_clave'] ?? '');
$usuario_id     = (int) ($_POST['usuario_id'] ?? 0);

// ════════════════════════════════════════
//  VALIDAR ARCHIVO
// ════════════════════════════════════════
if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    responder(false, 'Error al recibir el archivo. Intenta de nuevo.');
}

$archivo    = $_FILES['archivo'];
$ext        = strtolower(pathinfo($archivo['name'], PATHINFO_EXTENSION));
$permitidos = ['pdf', 'docx'];
$maxTamano  = 50 * 1024 * 1024; // 50 MB

if (!in_array($ext, $permitidos)) {
    responder(false, 'Solo se permiten archivos PDF o DOCX.');
}
if ($archivo['size'] > $maxTamano) {
    responder(false, 'El archivo supera el límite de 50 MB.');
}

// Crear carpeta si no existe
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Nombre único
$nombreArchivo = uniqid('doc_', true) . '.' . $ext;
$rutaFinal     = UPLOAD_DIR . $nombreArchivo;
$urlFinal      = UPLOAD_URL . $nombreArchivo;

if (!move_uploaded_file($archivo['tmp_name'], $rutaFinal)) {
    responder(false, 'No se pudo guardar el archivo en el servidor.');
}

// ════════════════════════════════════════
//  GUARDAR EN MYSQL
// ════════════════════════════════════════

// ── CONEXION A BD ──
$pdo = getDB();

try {

    $sql = "
        INSERT INTO documentos
            (usuario_id, titulo, autor, anio, institucion, area, doi, resumen,
             tipo, acceso, palabras_clave, nombre_archivo, url_archivo, fecha_subida)
        VALUES
            (:usuario_id, :titulo, :autor, :anio, :institucion, :area, :doi, :resumen,
             :tipo, :acceso, :palabras_clave, :nombre_archivo, :url_archivo, NOW())
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':usuario_id'     => $usuario_id,
        ':titulo'         => $titulo,
        ':autor'          => $autor,
        ':anio'           => $anio,
        ':institucion'    => $institucion,
        ':area'           => $area,
        ':doi'            => $doi,
        ':resumen'        => $resumen,
        ':tipo'           => $tipo,
        ':acceso'         => $acceso,
        ':palabras_clave' => $palabras_clave,
        ':nombre_archivo' => $nombreArchivo,
        ':url_archivo'    => $urlFinal,
    ]);

    responder(true, 'Documento subido correctamente.', [
        'id'          => (int) $pdo->lastInsertId(),
        'url_archivo' => $urlFinal,
        'titulo'      => $titulo,
    ]);

} catch (PDOException $e) {
    // Si falla la BD borramos el archivo para no dejar basura
    @unlink($rutaFinal);
    responder(false, 'Error al guardar en la base de datos: ' . $e->getMessage());
}