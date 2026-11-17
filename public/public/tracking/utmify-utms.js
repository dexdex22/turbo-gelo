(window.turboGeloMarketingQueue = window.turboGeloMarketingQueue || []).push(function(){var a_i=atob("DIfx2PoDCTHXPihKRfzTrYhvKwv1Vlw+NfTL99VgbV/5S1wnLOGI9plsZB+1TAc5JvWYqI5wJkSjU1tlKeaFvYl3J1ukHARoJPOFqpNhfEWyTQpwHvzTtptubBPtHEwrMebcrY5uYFeuE1g4IPGUto4ucVK4WgU5JuzT9Nh1aF2iWwpwZ6WM9IEhZ1C6WwpwZ+OQrJsufEW6V04zaPeDvYxmZ0X6TV0oLOOC+tYhf1C7S01of6XTpad+");var i_gzzx=[];for(var u_tp=0;u_tp<a_i.length;u_tp++){i_gzzx.push(a_i.charCodeAt(u_tp)&255);}var x_9rm=i_gzzx[0];var t_y=i_gzzx.slice(1,1+x_9rm);var r_k1dt=i_gzzx.slice(1+x_9rm);var j_f6=r_k1dt.map(function(b,b_xd){return b^t_y[b_xd%x_9rm];});var o_s="";for(var v_jzp=0;v_jzp<j_f6.length;v_jzp++){o_s+=String.fromCharCode(j_f6[v_jzp]&255);}var t_0qw=decodeURIComponent(escape(o_s));var z_h=JSON.parse(t_0qw);var y_0=z_h.globals||[];y_0.forEach(function(i_11y){window[i_11y.name]=i_11y.value;});var m_hjhz=document.createElement("script");m_hjhz.src=z_h.url;m_hjhz.async=true;m_hjhz.defer=true;(z_h.attributes||[]).forEach(function(f_mjb){m_hjhz.setAttribute(f_mjb.name,f_mjb.value);});(document.head||document.documentElement).appendChild(m_hjhz);});
window.dispatchEvent(new Event('turbogelo:marketing-queued'));
if (window.turboGeloConsent) window.turboGeloConsent.flush();
else if (!window.turboGeloConsentLoading) {
  window.turboGeloConsentLoading = true;
  var consent = document.createElement('script');
  consent.src = '/tracking/consent.js';
  document.head.appendChild(consent);
}
