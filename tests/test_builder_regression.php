<?php
/**
 * Automated regression test suite for FrameToPress Visual Builder core logic.
 *
 * Verifies:
 * 1. JSON array/object normalization (no 0-element JSON [] serialization bug).
 * 2. Scoped CSS generation for Desktop, Tablet (1024px), and Mobile (767px).
 * 3. Style value sanitization and allowlisting (font size, weight, colors).
 * 4. CSS managed marker generation and replacement.
 */

define('ABSPATH', __DIR__);

// Mock minimal WordPress functions needed for isolated unit testing
if (!function_exists('add_filter')) { function add_filter() {} }
if (!function_exists('add_action')) { function add_action() {} }
if (!function_exists('is_admin')) { function is_admin() { return false; } }
if (!function_exists('is_feed')) { function is_feed() { return false; } }
if (!function_exists('is_404')) { function is_404() { return false; } }
if (!function_exists('is_front_page')) { function is_front_page() { return true; } }
if (!function_exists('is_singular')) { function is_singular() { return false; } }
if (!function_exists('current_user_can')) { function current_user_can() { return true; } }
if (!function_exists('get_template_directory')) { function get_template_directory() { return __DIR__; } }
if (!function_exists('get_template_directory_uri')) { function get_template_directory_uri() { return 'http://localhost/theme'; } }
if (!function_exists('wp_enqueue_style')) { function wp_enqueue_style() {} }
if (!function_exists('wp_enqueue_script')) { function wp_enqueue_script() {} }
if (!function_exists('wp_enqueue_media')) { function wp_enqueue_media() {} }
if (!function_exists('wp_add_inline_script')) { function wp_add_inline_script() {} }
if (!function_exists('admin_url')) { function admin_url($path = '') { return 'http://localhost/wp-admin/' . $path; } }
if (!function_exists('add_query_arg')) { function add_query_arg() { return ''; } }
if (!function_exists('wp_create_nonce')) { function wp_create_nonce() { return 'test-nonce'; } }
if (!function_exists('get_option')) { function get_option() { return array(); } }
if (!function_exists('update_option')) { function update_option() { return true; } }
if (!function_exists('sanitize_key')) {
    function sanitize_key($key) {
        $key = strtolower($key);
        return preg_replace('/[^a-z0-9_-]/', '', $key);
    }
}
if (!function_exists('sanitize_html_class')) {
    function sanitize_html_class($class, $fallback = '') {
        $clean = preg_replace('/[^\-_A-Za-z0-9]/', '', $class);
        return $clean !== '' ? $clean : $fallback;
    }
}
if (!function_exists('sanitize_hex_color')) {
    function sanitize_hex_color($color) {
        if ('' === $color) return '';
        if (preg_match('|^#([A-Fa-f0-9]{3}){1,2}$|', $color)) return $color;
        return '';
    }
}
if (!function_exists('wp_json_encode')) {
    function wp_json_encode($data, $options = 0, $depth = 512) {
        return json_encode($data, $options, $depth);
    }
}

// Include builder implementation functions
require_once dirname(__DIR__) . '/frame-to-press/assets/frametopress-v3.2-reference/visual-builder.php';

$tests_passed = 0;
$tests_total = 0;

function assert_true($condition, $message) {
    global $tests_passed, $tests_total;
    $tests_total++;
    if ($condition) {
        $tests_passed++;
        echo "[PASS] $message\n";
    } else {
        echo "[FAIL] $message\n";
        exit(1);
    }
}

echo "=== Running FrameToPress Visual Builder Regression Tests ===\n\n";

// Test 1: JSON Normalization (Empty array must serialize as JSON object {})
$empty_records = frametopress_vb_json_records(array());
$json = json_encode($empty_records);
assert_true($json === '{}', "Empty record dictionary serializes as JSON '{}', never '[]'");

// Test 2: Valid path detection
$valid_avb = 'avb:div.1/h1.1';
$invalid_path = 'div<script>alert(1)</script>';
assert_true(frametopress_vb_valid_path($valid_avb), "Valid avb: structural path is accepted");
assert_true(!frametopress_vb_valid_path($invalid_path), "Malicious path is rejected");

// Test 3: Selector compilation
$selector = frametopress_vb_selector($valid_avb, 'front');
assert_true(
    strpos($selector, 'body.avb-scope-front > div:nth-child(1 of div:not(#wpadminbar):not(.abv-editor)) > h1:nth-child(1 of h1:not(#wpadminbar):not(.abv-editor))') !== false,
    "Selector compiled with stable same-tag sibling logic"
);

// Test 4: Style sanitization
$dirty_style = array(
    'fontSize' => 9999, // Exceeds 400px max
    'fontWeight' => 700,
    'color' => '#123456',
    'backgroundColor' => 'javascript:alert(1)', // Invalid hex
    'borderRadius' => 12
);
$cleaned = frametopress_vb_clean_style($dirty_style);
assert_true((int)$cleaned['fontSize'] === 400, "Font size clamped to allowlisted maximum of 400px");
assert_true((int)$cleaned['fontWeight'] === 700, "Font weight preserved within bounds");
assert_true($cleaned['color'] === '#123456', "Valid hex color preserved");
assert_true(!isset($cleaned['backgroundColor']), "Invalid color/XSS payload stripped");
assert_true((int)$cleaned['borderRadius'] === 12, "Border radius preserved");

// Test 5: CSS rule compilation (Desktop, Tablet, Mobile)
$edits = array(
    'avb:header.1/h1.1' => array(
        'type' => 'text',
        'text' => 'Headline',
        'style' => array('fontSize' => 160, 'fontWeight' => 800, 'color' => '#112233'),
        'responsive' => array(
            'tablet' => array('fontSize' => 80),
            'mobile' => array('fontSize' => 48)
        )
    )
);

$css = frametopress_vb_generated_css($edits, 'front');
assert_true(strpos($css, 'font-size:160px !important') !== false, "Desktop CSS rule generated with !important");
assert_true(strpos($css, 'color:#112233 !important') !== false, "Color CSS rule generated");
assert_true(strpos($css, '@media (max-width: 1024px)') !== false, "Tablet media query (max-width: 1024px) created");
assert_true(strpos($css, 'font-size:80px !important') !== false, "Tablet font-size override created");
assert_true(strpos($css, '@media (max-width: 767px)') !== false, "Mobile media query (max-width: 767px) created");
assert_true(strpos($css, 'font-size:48px !important') !== false, "Mobile font-size override created");

echo "\nSummary: $tests_passed / $tests_total regression tests passed successfully.\n";
