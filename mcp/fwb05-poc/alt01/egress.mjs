import dns from 'node:dns';
import { Agent } from 'undici';
import { requirePublicAnswers } from '../reg04d-r1/pinned-egress.mjs';

export function makeAltPinnedEgress({policy, fetcher = globalThis.fetch,
  resolver = hostname => dns.promises.lookup(hostname, {all: true, verbatim: true})
}) {
  const agent = new Agent({connections: 2, connect: {
    lookup(hostname, options, callback) {
      Promise.resolve().then(() => resolver(hostname)).then(requirePublicAnswers).then(
        ({address, family}) => {
          // Node requests an array when its address-family selection is active.
          // Return only the address already validated for this TLS connection.
          if (options.all) callback(null, [{address, family}]);
          else callback(null, address, family);
        },
        () => callback(Error('auth0_egress_nonpublic_dns_rejected'))
      );
    }
  }});
  async function fetch(url, options = {}) {
    policy.assertUrl(String(url));
    if (options.redirect && options.redirect !== 'error') throw Error('auth0_egress_redirect_denied');
    return fetcher(url, {...options, redirect: 'error', dispatcher: agent});
  }
  return {fetcher: fetch, close: () => agent.close()};
}
