(function () {
  if (window.turboGeloConsent || /^\/admin(?:\/|$)/.test(location.pathname)) return;
  var cookieName = 'tg_marketing_consent_v1';
  var saved = document.cookie.split('; ').find(function (c) { return c.indexOf(cookieName + '=') === 0; });
  var choice = saved ? saved.split('=')[1] : null;
  // A ativação automática é uma configuração da loja, não uma escolha expressa do visitante.
  var controller = window.turboGeloConsent = { allowed: choice !== 'denied', source: choice === 'granted' || choice === 'denied' ? 'saved-choice' : 'store-default', flush: flush };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  function state(value) {
    return { ad_storage: value, ad_user_data: value, ad_personalization: value, analytics_storage: value };
  }
  window.gtag('consent', 'default', state('denied'));
  window.gtag('set', 'ads_data_redaction', true);
  if (controller.allowed) window.gtag('consent', 'update', state('granted'));
  function flush() {
    if (!controller.allowed) return;
    var queue = window.turboGeloMarketingQueue || [];
    while (queue.length) queue.shift()();
  }
  window.addEventListener('turbogelo:marketing-queued', flush);
  flush();
})();
