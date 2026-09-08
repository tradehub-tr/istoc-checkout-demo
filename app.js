(() => {
  'use strict';
  const {fixture, documents} = JSON.parse(document.getElementById('demo-data').textContent);
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat('tr-TR', {style:'currency', currency:'TRY'}).format(value);
  const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const query = new URLSearchParams(location.search);
  const state = {owner:query.get('alici') === 'istoc' ? 'istoc':'seller', method:query.get('yontem') === 'kart' ? 'card':'bank', note:'', doc:null};
  const payKey = () => `${state.owner}_${state.method}`;
  const recipient = () => state.owner === 'istoc' ? 'İstoç.com işletmecisi' : fixture.seller;
  let toastTimer;
  function toast(message) { $('#toast').textContent=message; $('#toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').hidden=true,3600); }
  function invalidate(message='Ödeme seçiminiz değişti. Güncel ödeme koşullarını yeniden kabul ediniz.') {
    $('#terms-consent').checked=false;
    $('#consent-update').textContent=message;
    $('#consent-update').hidden=false;
    syncConsent();
  }
  function syncConsent() {
    $('#summary-place-order-btn').disabled=!($('#business-consent').checked && $('#terms-consent').checked);
    if($('#terms-consent').checked) $('#consent-update').hidden=true;
  }
  function render() {
    const platform=state.owner==='istoc', card=state.method==='card';
    $$('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenario===state.owner)));
    $$('input[name="method"]').forEach(r=>{r.checked=r.value===state.method;r.closest('.demo-method').classList.toggle('is-selected',r.checked);});
    $('#method-payee-label').textContent=(platform?'İSTOÇ.COM':'ÖRNEK ELEKTRİK')+' İÇİN ÖDEME YÖNTEMİ';
    $('#payee-name').textContent=platform?'İstoç.com':fixture.sellerShort;
    $('#payee-kind').textContent=platform?'Satıcı adına tahsilat · Koşulları görüntüle':'Doğrudan satıcıya · Koşulları görüntüle';
    $('.payee-symbol').innerHTML=platform?'<img src="assets/istoc-logo.png" alt="İstoç">':'ÖE';
    $('#payee-card').href='belgeler/'+documents[payKey()].file;
    $('#payment-terms-link').textContent=(platform?'İstoç.com üzerinden ':'satıcıya doğrudan ')+(card?'kartla Ödeme Koşullarını':'havale ile Ödeme Koşullarını');
    $('#payment-terms-link').href='belgeler/'+documents[payKey()].file;
    $('#payment-detail').innerHTML=card
      ? `<div class="payment-tags"><span>VISA</span><span>Mastercard</span><b>Tek çekim</b></div><p>Kartınızdan <strong>${money(fixture.total)}</strong> tahsil edilir. Ödeme <strong>Örnek Ödeme Kuruluşu</strong> aracılığıyla <strong>${recipient()}</strong> adına işlenir.</p><p class="payment-small">Kart işlemi bu önizlemede yalnızca örneklenir; kart bilgisi alınmaz.</p>`
      : `<p>Ödeme alıcısı: <strong>${recipient()}</strong></p><p>Havale açıklaması: <strong>${fixture.order}</strong>. Hesaba ulaşan ödeme doğrulandıktan sonra siparişin ödeme durumu güncellenir.</p><p class="payment-small">Banka hesap bilgileri son inceleme adımında gösterilir.</p>`;
    const url=new URL(location.href);
    url.searchParams.set('alici',state.owner);
    url.searchParams.set('yontem',card?'kart':'havale');
    history.replaceState(null,'',url);
    syncConsent();
  }
  function docKey(key) { return key==='payment'||key==='payee' ? payKey() : key; }
  function openDocument(key) {
    const resolved=docKey(key), d=documents[resolved];
    if(!d)return;
    state.doc=resolved;
    $('#document-title').textContent=d.title;
    $('#document-kicker').textContent=resolved==='sale'?'SATICI ↔ ALICI · SATIŞ KOŞULLARI':resolved==='platform'?'İSTOÇ ↔ KULLANICI · PLATFORM KOŞULLARI':'SEÇİLEN YÖNTEME AİT ÖDEME KOŞULLARI';
    $('#document-body').innerHTML=d.body;
    $('#document-open').href='belgeler/'+d.file;
    $('#document-download').setAttribute('aria-label',d.title+' HTML indir');
    if(!$('#document-dialog').open)$('#document-dialog').showModal();
    $('#document-body').scrollTop=0;
  }
  function flow(title,body) {
    $('#flow-title').textContent=title;
    $('#flow-body').innerHTML=body;
    if(!$('#flow-dialog').open)$('#flow-dialog').showModal();
  }
  function review() {
    if($('#summary-place-order-btn').disabled)return;
    flow('Siparişinizi gözden geçirin',`<p class="flow-note">Örnek sipariş · Gerçek ödeme ve sipariş oluşturulmaz.</p><div class="flow-facts"><div><span>Ürünün satıcısı</span><strong>${fixture.sellerShort}</strong></div><div><span>Ödeme alıcısı</span><strong>${recipient()}</strong></div><div><span>Ödeme yöntemi</span><strong>${state.method==='bank'?'Havale / EFT':'Kredi / banka kartı'}</strong></div><div><span>Ürün</span><strong>50 adet · Beyaz grup priz</strong></div><div><span>Toplam</span><strong>${money(fixture.total)}</strong></div></div><p class="flow-note">Kabul edilen belgeler: Satıcının B2B Satış ve Sipariş Koşulları (v1.0) ve ${escape(documents[payKey()].title)} (v1.0).</p><button class="demo-primary" id="demo-confirm">${state.method==='bank'?'Siparişi onayla ve banka bilgilerini gör':money(fixture.total)+' öde · Örnek işlem'}</button>`);
  }
  function complete() {
    if(state.method==='bank') {
      flow('Havale bilgileri',`<div class="flow-note-box"><strong>Yalnızca tasarım önizlemesi.</strong> Aşağıdaki hesap alanları örnektir; bu sayfadan gerçek ödeme yapılamaz.</div><div class="flow-facts"><div><span>Hesap sahibi</span><strong>${recipient()}</strong></div><div><span>Banka</span><strong>Örnek Banka</strong></div><div><span>IBAN</span><strong>TR•• •••• •••• •••• •••• •••• ••</strong></div><div><span>Tutar</span><strong>${money(fixture.total)}</strong></div><div><span>Açıklama</span><strong>${fixture.order}</strong></div><div><span>Durum</span><strong>Ödeme bekleniyor · Örnek</strong></div></div><p class="flow-note">Gerçek akışta, ödemenin hesaba ulaştığı doğrulandığında ödeme durumu güncellenir.</p><button class="demo-primary" data-close>Ödeme ekranına dön</button>`);
    } else {
      flow('Kart işlemi önizlemesi',`<div class="flow-note-box">Bu adım canlıda ödeme sağlayıcısının kart ve banka doğrulama ekranına devam eder. Önizlemede gerçek kart bilgisi istenmez ve tahsilat yapılmaz.</div><div class="flow-facts"><div><span>Tahsilatı alan</span><strong>${recipient()}</strong></div><div><span>Ödeme sağlayıcısı</span><strong>Örnek Ödeme Kuruluşu</strong></div><div><span>Örnek kart</span><strong>•••• 4242</strong></div><div><span>Tek çekim tutarı</span><strong>${money(fixture.total)}</strong></div></div><button class="demo-primary" id="simulate-success">Başarılı ödeme görünümünü göster</button>`);
    }
  }
  document.addEventListener('click',(event)=>{
    const target=event.target.closest('button,a');
    if(!target)return;
    if(target.dataset.scenario) { if(state.owner!==target.dataset.scenario){state.owner=target.dataset.scenario;invalidate();render();}return; }
    if(target.dataset.doc) { event.preventDefault();openDocument(target.dataset.doc);return; }
    if(target.hasAttribute('data-close')) {target.closest('dialog')?.close();return;}
    if(target.dataset.collapse) {const panel=document.getElementById(target.dataset.collapse);panel.hidden=!panel.hidden;target.setAttribute('aria-expanded',String(!panel.hidden));if(!target.classList.contains('co-product-head'))target.textContent=panel.hidden?'Düzenle':'Kapat';return;}
    if(target.dataset.billtype){$$('[data-billtype]').forEach(b=>{const active=b===target;b.setAttribute('aria-selected',String(active));b.classList.toggle('demo-selected',active);});$('#checkout-billing .co-pill-ghost').textContent=target.dataset.billtype==='sole'?'Şahıs işletmesi':'Şirket / Kurumsal';invalidate('Fatura seçiminiz değişti. Sipariş koşullarını yeniden kabul ediniz.');return;}
    if(target.dataset.scrollTo){document.querySelector(target.dataset.scrollTo)?.scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(target.id==='summary-place-order-btn'){review();return;}
    if(target.id==='demo-confirm'){complete();return;}
    if(target.id==='simulate-success'){flow('Örnek ödeme tamamlandı',`<div class="flow-note-box">Bu bir tasarım simülasyonudur. Hiçbir karttan tahsilat yapılmadı.</div><div class="flow-facts"><div><span>Ödeme alıcısı</span><strong>${recipient()}</strong></div><div><span>Örnek işlem tutarı</span><strong>${money(fixture.total)}</strong></div><div><span>Örnek durum</span><strong>Ödeme alındı</strong></div></div><button class="demo-primary" data-close>Ödeme ekranına dön</button>`);return;}
    if(target.id==='coupon-apply'){const field=$('#coupon-code');$('#coupon-error').textContent=field.value.trim()?'Bu örnek sipariş için kullanılabilir kupon bulunmuyor.':'Lütfen bir kupon kodu giriniz.';$('#coupon-error').hidden=false;return;}
    if(target.id==='document-print'){window.print();return;}
    if(target.id==='document-download'){
      const d=documents[state.doc];
      const html='<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(d.title)+'</title><style>body{font:15px/1.8 Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 20px;color:#333}h1{font-size:26px}h3{margin-top:25px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:12px;text-align:left}.document-notice{padding:15px;background:#fff8e8}.document-facts{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:20px 0}.document-facts span{display:block;color:#888;font-size:12px}.document-highlight{background:#f6f6f6;padding:15px}.document-highlight>span,.document-highlight>strong{display:block}</style><h1>'+escape(d.title)+'</h1><p>Örnek belge · 8 Eylül 2026 · Sipariş '+fixture.order+' · Sürüm 1.0</p>'+d.body+'</html>';
      const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=d.file;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);return;
    }
    if(target.dataset.action==='edit-address'){flow('Teslimat adresini düzenle',`<label for="demo-address">Örnek işletme teslimat adresi</label><textarea id="demo-address">${escape($('#shipping-address-text').textContent)}</textarea><p class="flow-note">Değişiklik yalnızca bu önizlemede tutulur.</p><button class="demo-primary" id="address-save">Adresi kaydet</button>`);return;}
    if(target.id==='address-save'){const val=$('#demo-address').value.trim();if(!val){$('#demo-address').setCustomValidity('Adres giriniz.');$('#demo-address').reportValidity();return;}$('#shipping-address-text').textContent=val;$('#flow-dialog').close();invalidate('Teslimat adresiniz değişti. Sipariş koşullarını yeniden kabul ediniz.');toast('Örnek teslimat adresi güncellendi.');return;}
    if(target.dataset.action==='seller-note'){flow('Satıcıya sipariş notu',`<label for="demo-note">Örnek Elektrik için notunuz</label><textarea id="demo-note" placeholder="Örneğin: Teslimattan önce haber verilmesini rica ederiz.">${escape(state.note)}</textarea><p class="flow-note">Notunuz satıcı tarafından ayrıca kabul edilmedikçe satış koşullarını değiştirmez.</p><button class="demo-primary" id="note-save">Notu kaydet</button>`);return;}
    if(target.id==='note-save'){state.note=$('#demo-note').value.trim();$('#flow-dialog').close();toast('Not önizlemeye kaydedildi.');return;}
    if(target.dataset.action==='reset'){location.href=location.pathname;return;}
    if(target.dataset.action==='cart-preview'){event.preventDefault();$('#checkout-items')?.scrollIntoView({behavior:'smooth'});toast('Örnek sepette 1 satıcıdan 50 adet ürün bulunuyor.');return;}
    if(target.closest('#checkout-items') && target.getAttribute('aria-expanded')){const content=target.nextElementSibling;if(content){content.hidden=!content.hidden;target.setAttribute('aria-expanded',String(!content.hidden));}}
  });
  document.addEventListener('change',(event)=>{
    if(event.target.matches('input[name="method"]')){state.method=event.target.value;invalidate();render();}
    if(event.target.matches('#business-consent,#terms-consent'))syncConsent();
    if(event.target.matches('[data-demo-field]'))invalidate('Fatura bilgileriniz değişti. Sipariş koşullarını yeniden kabul ediniz.');
  });
  $$('.document-dialog,.flow-dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}));
  render();
})();
