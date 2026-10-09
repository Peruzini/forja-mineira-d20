<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class FMC_Audit {
    public static function register_admin_page() {
        add_management_page(
            'Forja Mineira — Clusters',
            'Forja — Clusters',
            'manage_options',
            'forja-mineira-clusters',
            array( __CLASS__, 'render_admin_page' )
        );
    }

    public static function render_admin_page() {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $clusters = FMC_Registry::clusters();
        ?>
        <div class="wrap">
          <h1>Forja Mineira — Auditoria de Clusters</h1>
          <p>Leitura somente. Esta tela não altera páginas nem links automaticamente.</p>
          <?php foreach ( $clusters as $cluster_id => $cluster ) : ?>
            <h2><?php echo esc_html( $cluster['label'] ); ?></h2>
            <table class="widefat striped" style="max-width:1100px;margin-bottom:24px">
              <thead><tr><th>Nó</th><th>Destino</th><th>Resolução</th><th>Status</th></tr></thead>
              <tbody>
              <?php foreach ( $cluster['nodes'] as $node_id => $node ) :
                  $resolved = FMC_Resolver::resolve( $cluster_id, $node_id );
                  $status = true === $resolved['published'] ? 'Publicado' : ( false === $resolved['published'] ? 'Não resolvido' : 'Fallback — conferir' );
              ?>
                <tr>
                  <td><strong><?php echo esc_html( $node['title'] ); ?></strong><br><code><?php echo esc_html( $node_id ); ?></code></td>
                  <td><?php if ( ! empty( $resolved['url'] ) ) : ?><a href="<?php echo esc_url( $resolved['url'] ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $resolved['url'] ); ?></a><?php else : ?>—<?php endif; ?></td>
                  <td><code><?php echo esc_html( $resolved['source'] ); ?></code></td>
                  <td><?php echo esc_html( $status ); ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>

            <h3>Relações</h3>
            <table class="widefat striped" style="max-width:1100px;margin-bottom:32px">
              <thead><tr><th>Origem</th><th>Destinos estruturais</th><th>Validação</th></tr></thead>
              <tbody>
              <?php foreach ( $cluster['relations'] as $source => $targets ) :
                  $valid = ! in_array( $source, $targets, true );
              ?>
                <tr>
                  <td><code><?php echo esc_html( $source ); ?></code></td>
                  <td><?php echo esc_html( implode( ' → ', $targets ) ); ?></td>
                  <td><?php echo $valid ? '✓ Sem auto-link' : '⚠ Relação inválida'; ?></td>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          <?php endforeach; ?>
        </div>
        <?php
    }
}
