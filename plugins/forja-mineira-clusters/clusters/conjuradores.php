<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * FORJA-CLUSTER-EXP-02 — Conjuradores.
 *
 * Página 334: Guia de Itens Mágicos para Conjuradores.
 * Página 351: Build Doutor Destino (Doctor Doom).
 * A relação só aparece quando o destino possui status publish.
 * Não criar card recíproco no guia; vínculo contextual segue sob revisão SEO.
 */
return array(
    'label' => 'Conjuradores',
    'system' => 'D&D 5e 2024 / Artífice 2025',
    'default_title' => 'Continue explorando a magia.',
    'subtitle' => 'Explore os itens que complementam a progressão de personagens conjuradores.',
    'nodes' => array(
        'itens_conjuradores' => array(
            'title' => '10 Melhores Itens Mágicos para Conjuradores',
            'label' => 'Itens Mágicos',
            'role' => 'guide',
            'variant' => 'guide',
            'eyebrow' => 'GUIA DE ITENS MÁGICOS',
            'description' => 'Explore escolhas de equipamentos para conjuradores nos níveis 1–5, com atenção à defesa e à utilidade.',
            'cta' => 'Conhecer os 10 itens →',
            'icon' => 'itens.webp',
            'page_id' => 334,
        ),
        'doutor_destino' => array(
            'title' => 'Doutor Destino — Artífice 3 / Mago 17',
            'label' => 'Build',
            'role' => 'build',
            'variant' => 'build',
            'eyebrow' => 'BUILD TEMÁTICA',
            'description' => 'Uma progressão temática de Doutor Destino em D&D 5e 2024 e Artífice 2025.',
            'cta' => 'Explorar a build →',
            'icon' => 'builds.webp',
            'page_id' => 351,
        ),
    ),
    'relations' => array(
        // Matriz assimétrica aprovada; não criar card reverso no guia.
        'doutor_destino' => array( 'itens_conjuradores' ),
    ),
);
