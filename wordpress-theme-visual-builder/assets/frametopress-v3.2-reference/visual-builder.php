<?php
/**
 * frametopress Visual Builder v3.2 — theme CSS is the sole published styling authority.
 * Published style edits are compiled directly into a managed section of style.css.
 * Text and image content continue to be stored as sanitized WordPress options.
 * All edited CSS is scoped to the page, with independent desktop/tablet/mobile breakpoints. Theme-folder write access is required.
 */
if (!defined('ABSPATH')) exit;
function frametopress_vb_key() {
    if (is_front_page()) return 'front';
    if (is_singular()) return 'post-' . absint(get_queried_object_id());
    if (function_exists('is_shop') && is_shop()) return 'shop';
    if (function_exists('is_product_category') && is_product_category()) return 'cat-' . absint(get_queried_object_id());
    return 'path-' . substr(hash('sha256', (string)wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH)), 0, 20);
}
function frametopress_vb_option_name($key) { return 'frametopress_vb_' . sanitize_key($key); }
function frametopress_vb_revision($data) { return hash('sha256', wp_json_encode($data)); }
/** JSON must encode empty style maps as {}, not []. Otherwise JavaScript
 * silently drops named CSS fields from an array and readback mismatches occur. */
function frametopress_vb_json_records($saved) {
    if (!is_array($saved)) return (object) array();
    $result=array();
    foreach ($saved as $path=>$entry) {
        if (!is_array($entry)) continue;
        $entry['style']=(object)(isset($entry['style']) && is_array($entry['style']) ? $entry['style'] : array());
        if (isset($entry['responsive']) && is_array($entry['responsive'])) {
            $r=array();
            foreach (array('tablet','mobile') as $d) {
                if (isset($entry['responsive'][$d]) && is_array($entry['responsive'][$d])) $r[$d]=(object)$entry['responsive'][$d];
            }
            $entry['responsive']=(object)$r;
        }
        $result[$path]=$entry;
    }
    return (object)$result;
}

/** Stable page scope added to body, so each edited page has its own CSS rules. */
function frametopress_vb_body_class($classes) {
    $classes[] = 'avb-scope-' . sanitize_html_class(frametopress_vb_key());
    return $classes;
}
add_filter('body_class', 'frametopress_vb_body_class');

/** Compose a structural CSS selector from an editor path. No JavaScript-created
 * data attributes are necessary for published font/color/spacing changes.
 * :nth-child( N of TAG:not(...) ) matches our editor's stableChildren() logic,
 * regardless of WordPress's admin bar or the builder's temporary nodes. */
function frametopress_vb_selector($path, $page_key) {
    if (!frametopress_vb_valid_path($path)) return '';
    $scope = 'body.avb-scope-' . sanitize_html_class($page_key);
    if (strpos($path, 'avb:') !== 0) {
        // Older V2.4 CSS selectors are supported where the original structure still matches.
        return $scope . ' ' . preg_replace('/^body\s*/i', '', $path);
    }
    foreach (explode('/', substr($path, 4)) as $segment) {
        if (!preg_match('/^([a-z][a-z0-9-]*)\.([1-9][0-9]{0,4})$/i', $segment, $match)) return '';
        $tag = strtolower($match[1]);
        $index = (int)$match[2];
        $scope .= ' > ' . $tag . ':nth-child(' . $index . ' of ' . $tag . ':not(#wpadminbar):not(.abv-editor))';
    }
    return $scope;
}

/** Write ONLY the machine-owned section of the ORIGINAL theme style.css.
 * No selector or declaration outside these markers is modified.
 * Atomic replacement prevents visitors reading a half-written stylesheet. */
function frametopress_vb_write_theme_styles($current_key, $current_edits, &$failure = '') {
    $path = get_template_directory() . '/style.css';
    $directory = dirname($path);
    $start = "/* FRAMETOPRESS VISUAL BUILDER: BEGIN MANAGED RULES */";
    $end = "/* FRAMETOPRESS VISUAL BUILDER: END MANAGED RULES */";
    if (!is_file($path) || !is_writable($path) || !is_writable($directory)) {
        $failure = 'The WordPress server cannot write to the active theme style.css. Check theme-folder filesystem ownership and permissions; no changes were published.';
        return false;
    }
    $source = @file_get_contents($path);
    if ($source === false) { $failure = 'Could not read the original theme stylesheet.'; return false; }
    $s_pos = strpos($source, $start);
    $e_pos = strpos($source, $end);
    if (($s_pos === false) !== ($e_pos === false) || ($s_pos !== false && ($e_pos < $s_pos || strpos($source, $start, $s_pos + strlen($start)) !== false))) {
        $failure = 'Found conflicting builder markers in style.css. No file was changed.';
        return false;
    }

    $keys = get_option('frametopress_vb_managed_keys', array());
    if (!is_array($keys)) $keys = array();
    $keys[] = $current_key;
    $keys = array_values(array_unique(array_filter(array_map('sanitize_key', $keys))));
    if (count($keys) > 500) { $failure = 'The builder page limit has been reached.'; return false; }
    sort($keys, SORT_STRING);
    $compiled = "
" . $start . "
";
    $compiled .= "/* This CSS is automatically generated by frametopress. Do not edit between the markers. */
";
    foreach ($keys as $key) {
        $edits = $key === $current_key ? $current_edits : get_option(frametopress_vb_option_name($key), array());
        if (!is_array($edits) || !$edits) continue;
        $compiled .= frametopress_vb_generated_css($edits, $key);
    }
    $compiled .= $end . "
";
    if ($s_pos !== false) {
        $source = substr($source, 0, $s_pos) . ltrim($compiled, "
") . substr($source, $e_pos + strlen($end));
    } else {
        $source = rtrim($source, "
") . "
" . $compiled;
    }
    // WordPress host ownership can vary; use a temporary sibling and atomic rename.
    $tmp = @tempnam($directory, '.frametopress-css-');
    if (!$tmp) { $failure = 'Unable to create a temporary CSS file in the theme directory.'; return false; }
    if (@file_put_contents($tmp, $source, LOCK_EX) !== strlen($source)) {
        @unlink($tmp); $failure = 'Unable to write the updated CSS to the theme directory.'; return false;
    }
    $original_mode = @fileperms($path);
    if ($original_mode !== false) @chmod($tmp, $original_mode & 0777);
    if (!@rename($tmp, $path)) {
        @unlink($tmp); $failure = 'Unable to replace style.css. Check theme folder permissions.'; return false;
    }
    clearstatcache(true, $path);
    update_option('frametopress_vb_managed_keys', $keys, false);
    return true;
}

function frametopress_vb_assets() {
    if (is_admin() || is_feed() || is_404()) return;
    $dir = get_template_directory(); $url = get_template_directory_uri();
    $key = frametopress_vb_key(); $can_edit = current_user_can('edit_theme_options');
    $saved = get_option(frametopress_vb_option_name($key), array());
    if (!is_array($saved)) $saved = array();

    wp_enqueue_style('frametopress-vb', $url . '/builder/builder.css', array('frametopress-responsive'), substr(hash_file('sha256', $dir . '/builder/builder.css'), 0, 16));
    // The persistent stylesheet is always requested from an uncached WordPress
    // endpoint AFTER every theme stylesheet. The physical theme style.css is
    // still updated at Publish, but can be stale in an optimization/CDN cache.
    wp_enqueue_style('frametopress-vb-runtime', add_query_arg(array(
        'action' => 'frametopress_vb_styles', 'key' => $key, 'revision' => frametopress_vb_revision($saved)
    ), admin_url('admin-ajax.php')), array('frametopress-vb', 'frametopress-responsive'), '3.2.0');
    // IMPORTANT: never output database-generated inline CSS here. If cached,
    // that old CSS can override the *new* style.css after page load. Only the
    // physical theme style.css is the authority for published styling.

    wp_enqueue_script('frametopress-vb', $url . '/builder/builder.js', array(), substr(hash_file('sha256', $dir . '/builder/builder.js'), 0, 16), true);
    if ($can_edit) wp_enqueue_media();
    wp_add_inline_script('frametopress-vb', 'window.FrameToPressVisualBuilder=' . wp_json_encode(array(
        'isAdmin' => $can_edit, 'key' => $key, 'saved' => frametopress_vb_json_records($saved),
        'revision' => frametopress_vb_revision($saved), 'build' => '3.2.0',
        'ajax' => admin_url('admin-ajax.php'),
        'nonce' => $can_edit ? wp_create_nonce('frametopress_vb_save_' . $key) : '',
    )) . ';', 'before');
}
add_action('wp_enqueue_scripts', 'frametopress_vb_assets', 40);

/** Content-hashed CSS URL prevents sub-second timestamp/caching mismatches. */
function frametopress_vb_css_version() {
    $file = get_template_directory() . '/style.css';
    return is_file($file) ? substr(hash_file('sha256', $file), 0, 16) : 'missing';
}
function frametopress_vb_ensure_css_after_update() {
    // Rebuild managed theme CSS on the first admin visit after an update that
    // replaced style.css. Edits are preserved in wp_options, independently.
    if (!current_user_can('edit_theme_options')) return;
    $keys = get_option('frametopress_vb_managed_keys', array());
    if (!is_array($keys) || !$keys) return;
    $file = get_template_directory() . '/style.css';
    $css = is_file($file) ? @file_get_contents($file) : '';
    if (strpos((string)$css, '/* FRAMETOPRESS VISUAL BUILDER: BEGIN MANAGED RULES */') !== false) return;
    $key = sanitize_key(reset($keys));
    $edits = get_option(frametopress_vb_option_name($key), array());
    $reason = '';
    frametopress_vb_write_theme_styles($key, is_array($edits) ? $edits : array(), $reason);
}
add_action('init', 'frametopress_vb_ensure_css_after_update', 25);
function frametopress_vb_float($value, $min, $max) {
    if (!is_numeric($value)) return null;
    return min($max, max($min, (float)$value));
}
function frametopress_vb_clean_style($raw) {
    if (!is_array($raw)) return array();
    $clean = array();
    $numeric = array('fontSize'=>array(1,400),'fontWeight'=>array(100,900),'width'=>array(1,2500),'height'=>array(1,2500),'borderRadius'=>array(0,500),'letterSpacing'=>array(-10,30),'lineHeight'=>array(0.7,3),'paddingX'=>array(0,120),'paddingY'=>array(0,120));
    foreach ($numeric as $key=>$bounds) if (isset($raw[$key])) {
        $num=frametopress_vb_float($raw[$key],$bounds[0],$bounds[1]);
        if ($num!==null) $clean[$key]=$num;
    }
    foreach (array('color','backgroundColor','borderColor') as $k) if (isset($raw[$k])) {
        $v=sanitize_hex_color($raw[$k]); if ($v) $clean[$k]=$v;
    }
    if (isset($raw['fontFamily']) && in_array($raw['fontFamily'],array('inherit','Syne','DM Sans','Space Grotesk','Arial','Georgia','system-ui'),true)) $clean['fontFamily']=$raw['fontFamily'];
    if (isset($raw['fontStyle']) && in_array($raw['fontStyle'],array('normal','italic'),true)) $clean['fontStyle']=$raw['fontStyle'];
    if (isset($raw['textAlign']) && in_array($raw['textAlign'],array('left','center','right'),true)) $clean['textAlign']=$raw['textAlign'];
    if (isset($raw['objectFit']) && in_array($raw['objectFit'],array('cover','contain','fill','none','scale-down'),true)) $clean['objectFit']=$raw['objectFit'];
    return $clean;
}
/** Stable path format counts same-tag siblings but ignores WordPress admin toolbar/editor nodes. */
function frametopress_vb_valid_path($path) {
    if (preg_match('/^avb:(?:[a-z][a-z0-9-]*\\.[1-9][0-9]{0,4})(?:\\/[a-z][a-z0-9-]*\\.[1-9][0-9]{0,4}){0,39}$/i', $path)) return true;
    // Recognize previously saved V2.4 paths for backwards compatibility.
    return (bool)preg_match('/^body(?:\\s*>\\s*[a-z][a-z0-9-]*(?:\\:nth-of-type\\([0-9]{1,4}\\))?)+$/i', $path);
}
/** Build scoped selectors which the browser can match WITHOUT JavaScript. */
/** Single allowlisted style declaration generator. Breakpoint-specific rules reuse
 * this function, so preview and production use precisely the same properties. */
function frametopress_vb_compile_rule($path, $style, $page_key) {
    $selector = frametopress_vb_selector($path, $page_key);
    if (!$selector) return '';
    $style = frametopress_vb_clean_style($style);
    if (!$style) return '';
    $units = array('fontSize'=>'px', 'fontWeight'=>'', 'width'=>'px', 'height'=>'px', 'borderRadius'=>'px', 'letterSpacing'=>'px', 'lineHeight'=>'');
    $properties = array('fontSize'=>'font-size','fontWeight'=>'font-weight','width'=>'width','height'=>'height','borderRadius'=>'border-radius','letterSpacing'=>'letter-spacing','lineHeight'=>'line-height','color'=>'color','backgroundColor'=>'background-color','borderColor'=>'border-color','fontStyle'=>'font-style','textAlign'=>'text-align','objectFit'=>'object-fit');
    $rules = array();
    foreach ($properties as $key=>$property) {
        if (!array_key_exists($key, $style)) continue;
        $value = $style[$key];
        if (isset($units[$key])) $value = (string)(float)$value . $units[$key];
        $rules[] = $property . ':' . $value . ' !important';
    }
    if (isset($style['fontFamily'])) {
        $families = array('inherit'=>'inherit','Syne'=>'"Syne",sans-serif','DM Sans'=>'"DM Sans",sans-serif','Space Grotesk'=>'"Space Grotesk",sans-serif','Arial'=>'Arial,sans-serif','Georgia'=>'Georgia,serif','system-ui'=>'system-ui,sans-serif');
        $rules[] = 'font-family:' . $families[$style['fontFamily']] . ' !important';
    }
    if (isset($style['paddingX'])) {
        $value = (float)$style['paddingX'] . 'px !important';
        $rules[]='padding-left:'.$value;
        $rules[]='padding-right:'.$value;
    }
    if (isset($style['paddingY'])) {
        $value = (float)$style['paddingY'] . 'px !important';
        $rules[]='padding-top:'.$value;
        $rules[]='padding-bottom:'.$value;
    }
    return $rules ? $selector . '{' . implode(';', $rules) . ";}\n" : '';
}
/** Desktop styles load globally, tablet settings cascade down to mobile, and
 * mobile settings override both when the screen is <= 767px.
 * Same selector and data record per element, so existing V3.1 edits are kept. */
function frametopress_vb_generated_css($edits, $page_key = 'front') {
    if (!is_array($edits)) return '';
    $css = '/* frametopress page: ' . sanitize_key($page_key) . " */\n";
    $desktop = ''; $tablet = ''; $mobile = '';
    foreach (array_slice($edits, 0, 350, true) as $path=>$entry) {
        if (!is_string($path) || !frametopress_vb_valid_path($path) || !is_array($entry)) continue;
        $desktop .= frametopress_vb_compile_rule($path, $entry['style'] ?? array(), $page_key);
        $responsive = isset($entry['responsive']) && is_array($entry['responsive']) ? $entry['responsive'] : array();
        $tablet .= frametopress_vb_compile_rule($path, $responsive['tablet'] ?? array(), $page_key);
        $mobile .= frametopress_vb_compile_rule($path, $responsive['mobile'] ?? array(), $page_key);
    }
    $css .= $desktop;
    if ($tablet !== '') $css .= "@media (max-width: 1024px) {\n" . $tablet . "}\n";
    if ($mobile !== '') $css .= "@media (max-width: 767px) {\n" . $mobile . "}\n";
    return $css;
}
function frametopress_vb_clean_edits($edits) {
    if (!is_array($edits)) return array();
    $out=array();
    foreach (array_slice($edits,0,350,true) as $selector=>$entry) {
        if (!is_string($selector) || strlen($selector)>600 || !frametopress_vb_valid_path($selector)) continue;
        if (!is_array($entry) || !isset($entry['type']) || !in_array($entry['type'],array('text','image','button','background'),true)) continue;
        $clean=array('type'=>$entry['type']);
        if (array_key_exists('text',$entry) && in_array($entry['type'],array('text','button'),true)) $clean['text']=sanitize_textarea_field(substr((string)$entry['text'],0,10000));
        if (isset($entry['url']) && in_array($entry['type'],array('image','background'),true)) $clean['url']=esc_url_raw($entry['url'],array('https','http'));
        if (isset($entry['alt'])) $clean['alt']=sanitize_text_field(substr((string)$entry['alt'],0,1000));
        $clean['style']=frametopress_vb_clean_style($entry['style'] ?? array());
        if (isset($entry['responsive']) && is_array($entry['responsive'])) {
            $responsive=array();
            foreach (array('tablet','mobile') as $device) {
                if (isset($entry['responsive'][$device]) && is_array($entry['responsive'][$device])) {
                    $settings=frametopress_vb_clean_style($entry['responsive'][$device]);
                    if ($settings) $responsive[$device]=$settings;
                }
            }
            if ($responsive) $clean['responsive']=$responsive;
        }
        $out[$selector]=$clean;
    }
    return $out;
}
/** Always return the canonical saved data with no-store headers. Public visitors
 * only see edits that are already published visibly on the website. */
function frametopress_vb_load() {
    nocache_headers();
    $key = sanitize_key(wp_unslash($_REQUEST['key'] ?? ''));
    if (!$key || strlen($key) > 65 || !preg_match('/^[a-z0-9_-]+$/', $key)) {
        wp_send_json_error(array('message'=>'Invalid page identifier.'), 400);
    }
    // Product/page overrides are public only when the underlying post is public.
    if (!is_user_logged_in() && preg_match('/^post-([0-9]+)$/', $key, $parts)) {
        $post = get_post((int)$parts[1]);
        if (!$post || $post->post_status !== 'publish' || post_password_required($post)) {
            wp_send_json_error(array('message'=>'Page not publicly available.'), 404);
        }
    }
    $saved = get_option(frametopress_vb_option_name($key), array());
    if (!is_array($saved)) $saved = array();
    wp_send_json_success(array(
        'edits' => frametopress_vb_json_records($saved),
        'revision' => frametopress_vb_revision($saved),
        'count' => count($saved),
        'cssVersion' => frametopress_vb_css_version(),
    ));
}
add_action('wp_ajax_frametopress_vb_load', 'frametopress_vb_load');
add_action('wp_ajax_nopriv_frametopress_vb_load', 'frametopress_vb_load');

function frametopress_vb_save() {
    nocache_headers();
    if (!current_user_can('edit_theme_options')) {
        wp_send_json_error(array('message' => 'You do not have permission to publish website changes.'), 403);
    }
    $key = sanitize_key(wp_unslash($_POST['key'] ?? ''));
    if (!$key || strlen($key) > 65 || !preg_match('/^[a-z0-9_-]+$/', $key)) {
        wp_send_json_error(array('message' => 'Invalid page identifier.'), 400);
    }
    check_ajax_referer('frametopress_vb_save_' . $key, 'nonce');
    $raw = wp_unslash($_POST['edits'] ?? '');
    if (!is_string($raw) || strlen($raw) > 450000) {
        wp_send_json_error(array('message' => 'Edit payload is too large.'), 400);
    }
    $edits = json_decode($raw, true);
    if (!is_array($edits) || json_last_error() !== JSON_ERROR_NONE) {
        wp_send_json_error(array('message' => 'Invalid page changes JSON.'), 400);
    }
    // Never claim success for the exact failure shown in the screenshot:
    // no elements being sent despite an active editor session.
    if (!$edits && (string)($_POST['allow_empty'] ?? '') !== '1') {
        wp_send_json_error(array('message' => 'No edited elements were received. WordPress has not changed any CSS.'), 422);
    }
    $clean = frametopress_vb_clean_edits($edits);
    if (count($clean) !== count($edits)) {
        wp_send_json_error(array('message' => 'Some changes had invalid element identifiers. No changes saved; refresh the editor and try again.'), 422);
    }
    $option = frametopress_vb_option_name($key);
    $existing = get_option($option, array());
    if (!is_array($existing)) $existing = array();
    $base_revision = sanitize_text_field(wp_unslash($_POST['base_revision'] ?? ''));
    if ($base_revision && !hash_equals(frametopress_vb_revision($existing), $base_revision)) {
        wp_send_json_error(array('message'=>'This page was changed since you opened the editor. Reload the page before publishing to avoid overwriting newer edits.'), 409);
    }
    // CSS MUST be written to the active theme before we report a successful publish.
    $failure = '';
    if (!frametopress_vb_write_theme_styles($key, $clean, $failure)) {
        wp_send_json_error(array('message' => $failure ?: 'Could not write the theme stylesheet.'), 500);
    }
    update_option($option, $clean, false);
    // Always verify storage independently. CSS has already been written by this point.
    wp_cache_delete($option, 'options');
    $readback = get_option($option, null);
    if (!is_array($readback) || frametopress_vb_revision($clean) !== frametopress_vb_revision($readback)) {
        wp_send_json_error(array('message'=>'CSS was written but WordPress could not verify the database. Contact site administration.'), 500);
    }
    do_action('frametopress_visual_builder_published', $key, $readback);
    $theme_css = get_template_directory() . '/style.css';
    wp_send_json_success(array(
        'message' => 'Changes written directly to theme style.css and database.',
        'edits' => frametopress_vb_json_records($readback),
        'revision' => frametopress_vb_revision($readback),
        'count' => count($readback),
        'cssWritten' => true,
        'cssVersion' => frametopress_vb_css_version(),
    ));
}
add_action('wp_ajax_frametopress_vb_save', 'frametopress_vb_save');

/** Always-fresh stylesheet is the final CSS in wp_head. It reads exactly the
 * same published option as the builder, not cached HTML or a bundled file.
 * Public requests cannot access CSS of unpublished/protected pages. */
function frametopress_vb_styles() {
    $key = sanitize_key(wp_unslash($_GET['key'] ?? ''));
    if (!$key || strlen($key) > 65 || !preg_match('/^(front|shop|post-[0-9]+|cat-[0-9]+|path-[a-f0-9]{20})$/', $key)) {
        status_header(400); exit;
    }
    if (!is_user_logged_in() && preg_match('/^post-([0-9]+)$/', $key, $m)) {
        $post = get_post((int)$m[1]);
        if (!$post || $post->post_status !== 'publish' || post_password_required($post)) {
            status_header(404); exit;
        }
    }
    nocache_headers();
    header('Content-Type: text/css; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: private, no-store, no-cache, must-revalidate, max-age=0', true);
    $saved = get_option(frametopress_vb_option_name($key), array());
    echo is_array($saved) ? frametopress_vb_generated_css($saved, $key) : '/* No published edits */';
    exit;
}
add_action('wp_ajax_frametopress_vb_styles', 'frametopress_vb_styles');
add_action('wp_ajax_nopriv_frametopress_vb_styles', 'frametopress_vb_styles');
