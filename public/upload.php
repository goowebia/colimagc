<?php
// =========================================================================
// SCRIPT DE SUBIDA DE IMÁGENES - CLUB DE GOLF COLIMA
// Guarda imágenes de noticias en la carpeta /uploads/ del hosting
// =========================================================================

// Headers CORS para permitir peticiones desde el portal
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json; charset=utf-8');

// Comprobación de estado si se accede por GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'Colima GC Upload Service',
        'target_dir' => '/uploads/'
    ]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Utiliza POST.']);
    exit();
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $errCode = isset($_FILES['image']) ? $_FILES['image']['error'] : 'no_file';
    echo json_encode(['success' => false, 'message' => 'No se recibió ningún archivo de imagen válido. Código: ' . $errCode]);
    exit();
}

$file = $_FILES['image'];

// Límite de tamaño: 25 MB
$maxSize = 25 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El archivo supera el tamaño máximo permitido de 25MB.']);
    exit();
}

// Validar tipo de archivo real
$allowedMimes = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!array_key_exists($detectedMime, $allowedMimes)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Formato de imagen no permitido (' . $detectedMime . '). Solo se aceptan JPG, PNG, WEBP o GIF.'
    ]);
    exit();
}

$ext = $allowedMimes[$detectedMime];

// Directorio destino /uploads/
$targetDir = __DIR__ . '/uploads/';
if (!is_dir($targetDir)) {
    @mkdir($targetDir, 0777, true);
}

// Generar nombre de archivo único y seguro
$timestamp = date('Ymd_His');
$randomHash = bin2hex(random_bytes(4));
$filename = 'noticia_' . $timestamp . '_' . $randomHash . '.' . $ext;
$targetPath = $targetDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    // Resolver URL completa y relativa
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    $protocol = $isHttps ? 'https://' : 'http://';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'colimagolf.com';
    
    $fullUrl = $protocol . $host . '/uploads/' . $filename;
    $relativeUrl = '/uploads/' . $filename;

    echo json_encode([
        'success' => true,
        'message' => 'Imagen subida correctamente al hosting.',
        'url' => $fullUrl,
        'relative_url' => $relativeUrl,
        'filename' => $filename,
        'size' => $file['size']
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo guardar la imagen en la carpeta uploads. Por favor revisa los permisos del directorio.'
    ]);
}
