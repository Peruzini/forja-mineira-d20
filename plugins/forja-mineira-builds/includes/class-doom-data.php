<?php
/** Etapa 3: adaptador de DADOS, nao conecta shortcode nem renderiza novo nivel. */
if (!defined('ABSPATH')) { exit; }
final class FMB_Doom_Data {
    public static function load($path = null) {
        $path = $path ?: __DIR__ . '/../data/doom-approved-v1.json';
        if (!is_readable($path)) { throw new RuntimeException('Fonte Doom indisponivel.'); }
        $raw = file_get_contents($path);
        if ($raw === false) { throw new RuntimeException('Falha de leitura da fonte Doom.'); }
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data) || ($data['schema'] ?? null) !== 'forja-doom-build-data/1.0' ||
            ($data['build_id'] ?? null) !== 'doutor-destino' ||
            ($data['governanca']['publicacao_autorizada'] ?? true) !== false) {
            throw new RuntimeException('Contrato ou estado de governanca invalido.');
        }
        $levels = $data['niveis'] ?? [];
        if (count($levels) !== 10) { throw new RuntimeException('Contagem de niveis aprovados inesperada.'); }
        foreach ($levels as $index => $level) {
            if ((int)($level['nivel_total'] ?? 0) !== $index + 1 ||
                (int)($level['mecanica']['nivel_total'] ?? 0) !== $index + 1 ||
                (int)($level['mecanica']['artifice'] ?? -1) + (int)($level['mecanica']['mago'] ?? -1) !== $index + 1) {
                throw new RuntimeException('Ordem ou progressao dos niveis invalida.');
            }
            if (($level['status_aprovacao'] ?? '') !== 'APROVADO_MECANICAMENTE' ||
                ($level['publicacao_autorizada'] ?? true) !== false ||
                ($level['mecanica']['status'] ?? '') !== 'aprovado_consolidado_v1_0') {
                throw new RuntimeException('Nivel nao aprovado no pacote de previews.');
            }
        }
        return $data;
    }
    public static function get_approved_level($level, $path = null) {
        $data = self::load($path);
        foreach ($data['niveis'] as $row) {
            if ((int)($row['nivel_total'] ?? 0) === (int)$level) { return $row; }
        }
        return null; // Niveis nao homologados nao sao retornados por este adaptador.
    }
}
