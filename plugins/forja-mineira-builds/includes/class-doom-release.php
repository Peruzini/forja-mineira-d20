<?php
/** Production authorization is separate from the immutable DOOM-FINAL-01 source contracts. */
if (!defined('ABSPATH')) { exit; }
final class FMB_Doom_Release {
    private static $manifest = null;
    public static function is_public_level($level) {
        if (self::$manifest === null) {
            self::$manifest = false;
            $path = FMB_PATH . 'data/doom-release.json';
            if (!is_readable($path)) { return false; }
            $data = json_decode((string) file_get_contents($path), true);
            if (!is_array($data) || ($data['schema'] ?? '') !== 'forja-doom-production-release/1.0' ||
                ($data['publicacao_autorizada'] ?? false) !== true ||
                ($data['version'] ?? '') !== FMB_VERSION ||
                ($data['build_id'] ?? '') !== 'doutor-destino' ||
                ($data['levels'] ?? []) !== range(11, 20) || empty($data['sources'])) { return false; }
            foreach ($data['sources'] as $relative => $hash) {
                if (strpos($relative, '..') !== false || strpos($relative, 'data/doom-') !== 0 ||
                    !is_readable(FMB_PATH . $relative) || !hash_equals($hash, hash_file('sha256', FMB_PATH . $relative))) {
                    return false;
                }
            }
            self::$manifest = $data;
        }
        return is_array(self::$manifest) && in_array((int) $level, self::$manifest['levels'], true);
    }
}
