<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * FORJA-CLUSTER-EXP-02: primeiro nó do cluster Conjuradores.
 *
 * Nesta etapa, o guia pode ser resolvido pela página publicada (ID 334),
 * mas não há relações estruturais de saída. Doutor Destino entra em fase
 * posterior, mediante validação editorial, SEO e URL canônica.
 */
return array(
    'label' => 'Conjuradores',
    'system' => 'D&D 5e 2024',
    'nodes' => array(
        'itens_conjuradores' => array(
            'title' => '10 Melhores Itens Mágicos para Conjuradores',
            'label' => 'Itens Mágicos',
            'role' => 'guide',
            'variant' => 'guide',
            'eyebrow' => 'GUIA DE ITENS MÁGICOS',
            'description' => 'Equipamentos mágicos para conjuradores nos níveis 1–5, com escolhas por função e estilo de jogo.',
            'cta' => 'Explorar os 10 itens →',
            'page_id' => 334,
        ),
    ),
    'relations' => array(),
);
