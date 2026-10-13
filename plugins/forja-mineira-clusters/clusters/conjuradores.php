<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

return array(
    'label' => 'Conjuradores',
    'system' => 'D&D 5e 2024',
    'nodes' => array(
        'itens_conjuradores' => array(
            'title' => '10 Melhores Itens Mágicos para Conjuradores',
            'label' => 'Itens para Conjuradores',
            'role' => 'guide',
            'variant' => 'guide',
            'eyebrow' => 'GUIA DE ITENS MÁGICOS',
            'description' => 'Compare dez itens mágicos para conjuradores nos níveis 1–5, por função, raridade e sintonização.',
            'cta' => 'Explorar guia de itens →',
            'page_id' => 334,
            'shortcode' => 'forja_itens_conjuradores_2024',
        ),
    ),
    // Sem relações estruturais nesta etapa: a build Doutor Destino será integrada depois.
    'relations' => array(
        'itens_conjuradores' => array(),
    ),
);
