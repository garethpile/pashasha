(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  'object' == typeof document ? document.currentScript : void 0,
  80090,
  (e) => {
    'use strict';
    let t = (0, e.i(75863).resolveCoreApiRoot)(),
      o = async (e, o = {}) => {
        let n = await fetch(`${t}${e}`, {
            ...o,
            headers: { 'Content-Type': 'application/json', ...o.headers },
            cache: 'no-store',
          }),
          i = await n.text(),
          r = null;
        try {
          r = i ? JSON.parse(i) : null;
        } catch {
          r = i;
        }
        if (!n.ok) {
          if (r && 'object' == typeof r && 'string' == typeof r.message) throw Error(r.message);
          if ('string' == typeof r && r.trim().length > 0) throw Error(r);
          throw Error(`Request failed (${n.status})`);
        }
        return r;
      };
    e.s([
      'corePublicApi',
      0,
      {
        lookupCivilServant: (e) =>
          o(`/api/public/civil-servants/lookup?qrToken=${encodeURIComponent(e)}`),
        lookupCivilServantById: (e) =>
          o(`/api/public/civil-servants/lookup?publicId=${encodeURIComponent(e)}`),
        createPaymentIntent: (e) =>
          o('/api/public/payment-intents', { method: 'POST', body: JSON.stringify(e) }),
        getPaymentIntent: (e) => o(`/api/public/payment-intents/${encodeURIComponent(e)}`),
      },
    ]);
  },
]);
