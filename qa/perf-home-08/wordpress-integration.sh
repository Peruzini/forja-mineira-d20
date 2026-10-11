#!/usr/bin/env bash
set -Eeuo pipefail
# PERF-HOME-08: brand-new temporary WP and DB, all HTTP requests use localhost.
ROOT="$(pwd)"
WP_DIR="$(mktemp -d /tmp/forja-wp-08-XXXX)"
WP="php /tmp/forja-perf-wp-cli.phar"
PORT=8878
export WP_CLI_ALLOW_ROOT=1
say(){ echo "::notice title=PERF-HOME-08::$*"; }
fail(){ echo "::error title=PERF-HOME-08::$*" >&2; exit 1; }
expect(){ grep -Fq "$1" "$2" || fail "Expected $1 missing from $2"; }
reject(){ if grep -Fq "$1" "$2"; then fail "Unexpected $1 in $2"; fi; }
curl -fLsS --retry 2 https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar -o /tmp/forja-perf-wp-cli.phar
$WP --info
$WP core download --path="$WP_DIR"
$WP config create --path="$WP_DIR" --dbname=forjaperf08 --dbuser=perf08 \
  --dbpass=perf08_only_local --dbhost=127.0.0.1:3306 --skip-check
$WP core install --path="$WP_DIR" --url="http://127.0.0.1:$PORT" \
  --title="Forja QA Local PERF-HOME-08" --admin_user=qa_local \
  --admin_password=qa_local_only --admin_email=qa@example.test --skip-email
mkdir -p "$WP_DIR/wp-content/plugins"
cp -a "$ROOT/plugins/forja-mineira-builds" "$WP_DIR/wp-content/plugins/"
$WP plugin activate forja-mineira-builds --path="$WP_DIR"

home_id=$($WP post create --path="$WP_DIR" --post_type=page --post_status=publish \
  --post_title="Home PERF-HOME-08" --post_name=home-perf-08 \
  --post_content='[forja_home_hero][forja_home_build_cycle][forja_home_featured_guide]' --porcelain)
$WP option update show_on_front page --path="$WP_DIR"
$WP option update page_on_front "$home_id" --path="$WP_DIR"
build_id=$($WP post create --path="$WP_DIR" --post_type=page --post_status=publish \
  --post_title=Build --post_name=build-test --post_content='[forja_build nome="voldemort"]' --porcelain)
hub_id=$($WP post create --path="$WP_DIR" --post_type=page --post_status=publish \
  --post_title=Hub --post_name=hub-test --post_content='[forja_builds_hub]' --porcelain)

$WP server --path="$WP_DIR" --host=127.0.0.1 --port=$PORT >/tmp/forja-perf-home-08-server.log 2>&1 &
WP_SERVER_PID=$!
trap 'kill "$WP_SERVER_PID" 2>/dev/null || true' EXIT
for n in $(seq 1 30); do
  if curl --silent --fail --output /dev/null "http://127.0.0.1:$PORT/"; then break; fi
  sleep 1
done
curl --fail --silent --show-error "http://127.0.0.1:$PORT/" -o /tmp/forja-home-08-candidate.html
curl --fail --silent --show-error "http://127.0.0.1:$PORT/?page_id=$build_id" -o /tmp/forja-home-08-build.html
curl --fail --silent --show-error "http://127.0.0.1:$PORT/?page_id=$hub_id" -o /tmp/forja-home-08-hub.html

# Verify real shortcode output, CSS routing, JS, and vote markup.
expect 'fmb-home-hero' /tmp/forja-home-08-candidate.html
expect 'fmb-build-cycle' /tmp/forja-home-08-candidate.html
expect 'fmb-featured-guide' /tmp/forja-home-08-candidate.html
expect 'assets/css/home.css' /tmp/forja-home-08-candidate.html
reject 'assets/css/builds.css' /tmp/forja-home-08-candidate.html
expect 'assets/js/builds.js' /tmp/forja-home-08-candidate.html
expect 'data-fmb-vote' /tmp/forja-home-08-candidate.html
expect 'data-vote-endpoint=' /tmp/forja-home-08-candidate.html
expect 'assets/css/builds.css' /tmp/forja-home-08-build.html
reject 'assets/css/home.css' /tmp/forja-home-08-build.html
expect 'assets/css/hub.css' /tmp/forja-home-08-hub.html
reject 'assets/css/builds.css' /tmp/forja-home-08-hub.html
reject 'assets/js/builds.js' /tmp/forja-home-08-hub.html
say 'PASS — Home and Build retain JS; Hub uses hub.css without unnecessary JS'

curl --fail --silent --show-error \
  "http://127.0.0.1:$PORT/wp-content/plugins/forja-mineira-builds/assets/css/home.css" \
  -o /tmp/forja-home-08-loaded-css.css
cmp /tmp/forja-home-08-loaded-css.css "$ROOT/plugins/forja-mineira-builds/assets/css/home.css" || fail 'Served CSS mismatch'
curl --fail --silent --show-error \
  "http://127.0.0.1:$PORT/wp-content/plugins/forja-mineira-builds/assets/js/builds.js" \
  -o /tmp/forja-home-08-loaded-js.js
say 'PASS — WordPress localhost serves exact candidate CSS and JS'

# Fallback is simulated ONLY inside the temporary WordPress install.
mv "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/home.css" \
  "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/home.css.test-hidden"
curl --fail --silent --show-error "http://127.0.0.1:$PORT/" -o /tmp/forja-home-08-fallback.html
expect 'assets/css/builds.css' /tmp/forja-home-08-fallback.html
reject 'assets/css/home.css' /tmp/forja-home-08-fallback.html
mv "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/home.css.test-hidden" \
  "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/home.css"
say 'PASS — if home.css is missing, WordPress uses approved builds.css fallback'

# Dedicated Hub CSS must serve correct bytes and revert cleanly if absent.
curl --fail --silent --show-error \
  "http://127.0.0.1:$PORT/wp-content/plugins/forja-mineira-builds/assets/css/hub.css" \
  -o /tmp/forja-builds-02-loaded-hub.css
cmp /tmp/forja-builds-02-loaded-hub.css "$ROOT/plugins/forja-mineira-builds/assets/css/hub.css" \
  || fail 'Served Hub CSS mismatch'
mv "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/hub.css" \
  "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/hub.css.test-hidden"
curl --fail --silent --show-error "http://127.0.0.1:$PORT/?page_id=$hub_id" \
  -o /tmp/forja-builds-02-hub-fallback.html
expect 'assets/css/builds.css' /tmp/forja-builds-02-hub-fallback.html
expect 'assets/js/builds.js' /tmp/forja-builds-02-hub-fallback.html
reject 'assets/css/hub.css' /tmp/forja-builds-02-hub-fallback.html
mv "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/hub.css.test-hidden" \
  "$WP_DIR/wp-content/plugins/forja-mineira-builds/assets/css/hub.css"
say 'PASS — Hub CSS file is served exactly and fallback restores full CSS + JS'


# REST voting tested exclusively on localhost disposable database.
VOTE="http://127.0.0.1:$PORT/?rest_route=/forja-mineira/v1/vote"
curl --fail --silent --show-error "$VOTE" -o /tmp/forja-home-08-vote-get.json
php -r '$v=json_decode(file_get_contents("/tmp/forja-home-08-vote-get.json"),true); if(!$v || !isset($v["poll_id"]) || empty($v["open"])) exit(1);'
curl --fail --silent --show-error -X POST "$VOTE" \
  --data-urlencode candidate=guts --data-urlencode poll_id=1 \
  -o /tmp/forja-home-08-vote-post.json
php -r '$v=json_decode(file_get_contents("/tmp/forja-home-08-vote-post.json"),true); if(empty($v["registered"]) || ($v["candidate"]??"")!=="guts") exit(1);'
$WP option update fmb_build_vote_open 0 --path="$WP_DIR" >/dev/null
code=$(curl --silent --output /tmp/forja-home-08-vote-closed.json --write-out "%{http_code}" \
  -X POST "$VOTE" --data-urlencode candidate=guts --data-urlencode poll_id=1)
[ "$code" = "403" ] || fail "Closed poll should return 403, got $code"
say 'PASS — localhost voting GET, POST registration and closed-poll guard'

$WP plugin list --path="$WP_DIR" --fields=name,status,version | grep 'forja-mineira-builds'
cat <<SUMMARY | tee -a "$GITHUB_STEP_SUMMARY"
# PERF-HOME-08 — Staging WordPress efêmero
- Instalação WordPress + MySQL própria; endpoint HTTP somente no loopback 127.0.0.1:$PORT.
- Home: home.css e builds.js, shortcodes Hero/Cycle/Featured: PASS.
- Build Voldemort: builds.css e builds.js; Hub: hub.css sem builds.js: PASS.
- Entrega dos arquivos CSS/JS pelo servidor: PASS.
- Simulação da ausência de home.css e de hub.css / fallbacks originais: PASS.
- Votação REST GET, POST Guts e rejeição de voto após encerramento (403): PASS.
- Produção NÃO alterada. Não reproduz tema Hostinger nem mede LCP do site real.
SUMMARY
