/* =====================================================================
   LIVE KHAATA WEBSITE — SETTINGS
   Edit only this block. Leave a value as '' until it is ready.
   ===================================================================== */
window.LK_CONFIG = {
  email:    'support@livekhaata.app',   // support email shown everywhere, e.g. 'support@livekhaata.app'
  playUrl:  '',        // Play Store listing link (Download buttons show 'Coming soon' while empty)
  refund:   '7day',    // '7day' or 'none'
  paymentsLive:   false, // set true once Razorpay + licence backend are live
  codeRedeemLive: false  // set true once activation-code backend is live
};
/* ===================================================================== */

(function(){
  'use strict';
  var C = window.LK_CONFIG || {};
  var LANG = (document.documentElement.lang || 'hi').slice(0,2);
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

  function mailLink(body){
    if(!C.email) return '';
    return 'mailto:' + C.email + '?subject=' + encodeURIComponent('Live Khaata') + (body ? '&body=' + encodeURIComponent(body) : '');
  }

  /* ---- fill business details ---- */
  $$('[data-cfg]').forEach(function(el){
    var k = el.getAttribute('data-cfg');
    var v = C[k];
    if(v){ el.textContent = v; }
    else { el.textContent = '—'; el.classList.add('cfg-missing'); }
  });

  /* ---- links that depend on settings ---- */
  $$('[data-href]').forEach(function(el){
    var k = el.getAttribute('data-href');
    var url = k === 'mail' ? mailLink(el.getAttribute('data-mail-text') || '') : C[k];
    if(url){ el.setAttribute('href', url); if(/^https?:/.test(url)){ el.setAttribute('target','_blank'); el.setAttribute('rel','noopener'); } }
    else {
      el.setAttribute('aria-disabled','true'); el.removeAttribute('href');
      if(el.getAttribute('data-soon')) el.textContent = el.getAttribute('data-soon');
    }
  });

  /* ---- refund variant ---- */
  $$('[data-refund]').forEach(function(el){ el.hidden = el.getAttribute('data-refund') !== C.refund; });
  if(C.refund !== '7day' && C.refund !== 'none'){ try{ console.warn('LK_CONFIG.refund is not set'); }catch(e){} }

  /* ---- helpers ---- */
  function normPhone(v){
    var d = String(v||'').replace(/\D/g,'');
    if(d.length === 12 && d.indexOf('91') === 0) d = d.slice(2);
    if(d.length === 11 && d.charAt(0) === '0') d = d.slice(1);
    return /^[6-9]\d{9}$/.test(d) ? d : '';
  }
  var GST_CH = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function gstinOk(g){
    g = String(g||'').toUpperCase();
    if(!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return false;
    var sum = 0;
    for(var i=0;i<14;i++){
      var p = GST_CH.indexOf(g.charAt(i)) * (i % 2 ? 2 : 1);
      sum += Math.floor(p/36) + (p % 36);
    }
    return GST_CH.charAt((36 - (sum % 36)) % 36) === g.charAt(14);
  }
  function setBad(field, bad){ var f = field.closest('.f'); if(f) f.classList.toggle('bad', !!bad); }
  function row(a,b,tot){ return '<div class="sumrow'+(tot?' tot':'')+'"><span>'+a+'</span><span>'+b+'</span></div>'; }

  /* ---- checkout ---- */
  var buy = $('#buy-form');
  if(buy){
    var st = $('#b-state'), g = $('#b-gstin'), sum = $('#b-sum'), T = buy.dataset;
    var paint = function(){
      var intra = st.value === '09';
      sum.innerHTML = row(T.lic,'₹799') + (intra ? row('CGST 9%','₹72') + row('SGST 9%','₹72') : row('IGST 18%','₹144')) + row(T.total,'₹943',1);
    };
    g.addEventListener('input', function(){
      g.value = g.value.toUpperCase().replace(/[^0-9A-Z]/g,'');
      var c = g.value.slice(0,2);
      if(/^\d\d$/.test(c) && st.querySelector('option[value="'+c+'"]')){ st.value = c; paint(); }
      if(g.value.length === 15) setBad(g, !gstinOk(g.value)); else setBad(g, false);
    });
    st.addEventListener('change', paint); paint();

    buy.addEventListener('submit', function(ev){
      ev.preventDefault();
      var ph = $('#b-phone'), nm = $('#b-name'), em = $('#b-email'), ag = $('#b-agree');
      var phone = normPhone(ph.value), name = nm.value.trim(), gstin = g.value.trim(), email = em.value.trim();
      var ok = true;
      setBad(ph, !phone); ok = ok && !!phone;
      setBad(nm, !name); ok = ok && !!name;
      var gBad = gstin && !gstinOk(gstin); setBad(g, gBad); ok = ok && !gBad;
      var eBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email); setBad(em, eBad); ok = ok && !eBad;
      $('#b-agree-err').style.display = ag.checked ? 'none' : 'block'; ok = ok && ag.checked;
      if(!ok){ var b = $('.f.bad input, .f.bad select', buy) || (ag.checked ? null : ag); if(b) b.focus(); return; }

      var order = { phone:'+91'+phone, name:name, gstin:gstin || null, stateCode:st.value,
        stateName: st.options[st.selectedIndex].text, email: email, amountPaise: 94300, currency:'INR', lang: LANG };

      if(C.paymentsLive && typeof window.LK_startPayment === 'function'){ window.LK_startPayment(order); return; }
      var n = $('#b-notice'); n.classList.add('on');
      var wa = $('#b-wa'); var txt = T.mail + '\n\n' + name + '\n' + order.phone + '\n' + (gstin ? 'GSTIN ' + gstin + '\n' : '') + order.stateName + '\n' + email;
      var link = mailLink(txt); if(link){ wa.href = link; wa.removeAttribute('aria-disabled'); } else { wa.setAttribute('aria-disabled','true'); }
      n.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  /* ---- activation code ---- */
  var act = $('#act-form');
  if(act){
    var cells = $$('.code input', act), ALPHA = /[^2-9A-HJ-NP-Z]/g; // no 0, O, 1, I
    cells.forEach(function(c,i){
      c.addEventListener('input', function(){
        c.value = c.value.toUpperCase().replace(ALPHA,'').slice(-1);
        if(c.value && cells[i+1]) cells[i+1].focus();
      });
      c.addEventListener('keydown', function(e){ if(e.key === 'Backspace' && !c.value && cells[i-1]) cells[i-1].focus(); });
      c.addEventListener('paste', function(e){
        var t = (e.clipboardData || window.clipboardData).getData('text').toUpperCase().replace(ALPHA,'');
        if(t.length > 1){ e.preventDefault(); cells.forEach(function(x,j){ x.value = t.charAt(j) || ''; }); (cells[Math.min(t.length,cells.length)-1]).focus(); }
      });
    });
    act.addEventListener('submit', function(ev){
      ev.preventDefault();
      var code = cells.map(function(c){ return c.value; }).join('');
      var ph = $('#a-phone'), phone = normPhone(ph.value);
      var codeBad = code.length !== 6; $('#a-code-err').style.display = codeBad ? 'block' : 'none';
      setBad(ph, !phone);
      if(codeBad || !phone) return;
      if(C.codeRedeemLive && typeof window.LK_redeemCode === 'function'){ window.LK_redeemCode(code, '+91'+phone); return; }
      var n = $('#a-notice'); n.classList.add('on');
      var wa = $('#a-wa'), link = mailLink(act.dataset.mail + '\n\n' + code + '\n+91' + phone);
      if(link){ wa.href = link; wa.removeAttribute('aria-disabled'); } else { wa.setAttribute('aria-disabled','true'); }
    });
  }
})();
