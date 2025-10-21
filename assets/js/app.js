    /* ---------- tiny helpers ---------- */
    const $ = (s,sc)=> (sc||document).querySelector(s);
    const $$ = (s,sc)=> Array.from((sc||document).querySelectorAll(s));
    const on = (el,ev,cb,opt)=> el && el.addEventListener(ev,cb,opt);

    /* -------- Reveal + year + min date -------- */
    document.addEventListener('DOMContentLoaded', ()=>{
      // staged hero reveals
      setTimeout(()=>$('#heroEyebrow')?.classList.add('visible'),120);
      setTimeout(()=>$('#heroTitle')?.classList.add('visible'),260);
      setTimeout(()=>$('#heroLead')?.classList.add('visible'),420);

      // service cards reveal
      $$('.service').forEach((s,i)=>setTimeout(()=>s.classList.add('visible'),600+(i*140)));

      // footer year
      $('#year').textContent = new Date().getFullYear();

      // date min (local time)
      const today = new Date(); today.setHours(0,0,0,0);
      const iso = new Date(today.getTime() - today.getTimezoneOffset()*60000).toISOString().split('T')[0];
      $('#date')?.setAttribute('min', iso);
    });

    /* -------- Mobile nav ---------- */
    const burger = $('#hamburger');
    const menu = $('#mobileMenu');
    const overlay = $('#mobileOverlay');
    const closeBtn = $('#mobileClose');

    function lockScroll(lock){ document.documentElement.style.overflow = lock ? 'hidden' : ''; }
    function setMenuOpen(open){
      menu.classList.toggle('open', open);
      overlay.classList.toggle('show', open);
      burger?.setAttribute('aria-expanded', String(open));
      menu?.setAttribute('aria-hidden', String(!open));
      lockScroll(open);
      if(open) menu.querySelector('a')?.focus();
      else burger?.focus();
    }
    on(burger,'click',()=>setMenuOpen(true));
    on(overlay,'click',()=>setMenuOpen(false));
    on(closeBtn,'click',()=>setMenuOpen(false));
    on(menu,'click', e=>{ if(e.target.tagName==='A'){ setMenuOpen(false); } });
    on(document,'keydown', e=>{ if(e.key==='Escape') setMenuOpen(false); });

    /* -------- Booking modal (focus-safe) ---------- */
    const modal = $('#bookingModal');
    const dialog = $('#bookingDialog');
    const modalCloseBtn = $('#modalCloseBtn');
    const cancelBtn = $('#cancelBtn');

    ['#open-booking','#bookCta','#mobileBook'].forEach(sel=>{
      on($(sel),'click',()=>{
        modal.style.display='block';
        lockScroll(true);
        setTimeout(()=>dialog.focus(),0);
      });
    });

    function closeModal(){ modal.style.display='none'; lockScroll(false); }
    on(modalCloseBtn,'click', closeModal);
    on(cancelBtn,'click', closeModal);
    on(modal,'click', (e)=>{ if(e.target === modal) closeModal(); });
    on(document,'keydown',e=>{ if(e.key==='Escape') closeModal(); });

    /* -------- Booking form: live validation + submit ---------- */
    const bookingForm = $('#bookingForm');
    const bookingBtn = $('#bookingSubmit');
    const reqs = ['name','phone','email','date','time','address'].map(id=>$('#'+id));
    const errs = {
      name: $('#err-name'), phone: $('#err-phone'), email: $('#err-email'),
      date: $('#err-date'), time: $('#err-time'), address: $('#err-address')
    };

    function validateField(input){
      const id = input.id;
      let msg = '';
      if(!input.value.trim()){ msg = 'Required field.'; }
      else if(id==='phone' && input.dataset.badPhone === '1'){ msg = 'Use a valid Canada/US phone number.'; }
      else if(id==='time'){
        const [h,m] = input.value.split(':').map(Number);
        if(isFinite(h) && isFinite(m)){
          const mins = h*60+m;
          if(mins < 8*60 || mins > 18*60) msg = 'Please choose between 08:00–18:00.';
        }
      }
      const err = errs[id]; if(!err) return true;
      if(msg){ err.textContent = msg; err.style.display='block'; input.setAttribute('aria-invalid','true'); }
      else{ err.textContent=''; err.style.display='none'; input.removeAttribute('aria-invalid'); }
      return !msg;
    }

    function enableIfValid(){
      const ok = reqs.every(validateField);
      bookingBtn.disabled = !ok;
    }

    reqs.forEach(inp=>{
      on(inp,'input',enableIfValid);
      on(inp,'blur',()=>{ validateField(inp); enableIfValid(); });
    });

    // lightweight phone pattern assist
    on($('#phone'),'input', e=>{
      const v = e.target.value.trim();
      e.target.dataset.badPhone = (/^\+?1?[\s\-\.]?\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}$/).test(v) ? '0':'1';
    });

    on(bookingForm,'submit', function(e){
      e.preventDefault();
      enableIfValid();
      if(bookingBtn.disabled) return;

      const data = new FormData(e.target);
      const obj = Object.fromEntries(data.entries());

      const result = $('#bookingResult');
      result.style.display='block';
      result.textContent = `Thanks ${obj.name}. Your request for "${obj.service}" has been received. We will contact you at ${obj.email} or ${obj.phone} to confirm. Please ensure the horse is caught and brushed before the therapist arrives.`;
      e.target.reset();
      bookingBtn.disabled = true;
      setTimeout(()=>closeModal(), 2200);
    });

    /* -------- Contact form (tiny UX polish) ---------- */
    const contactForm = $('#contactForm'), contactSubmit = $('#contactSubmit'), contactResult = $('#contactResult');
    on(contactForm,'submit', ()=>{
      const name = $('#msgname').value.trim();
      const email = $('#msgemail').value.trim();
      const msg = $('#msgtext').value.trim();
      if(!name || !email || !msg){ alert('Please complete name, email and message.'); return; }
      contactSubmit.disabled = true; contactSubmit.textContent = 'Sending…';
      setTimeout(()=>{
        contactResult.style.display='block';
        contactResult.textContent = `Thanks ${name}! Your message has been sent. We’ll reply to you shortly.`;
        contactForm.reset();
        contactSubmit.textContent='📅 Send Message';
        contactSubmit.disabled = false;
      }, 600);
    });

    /* -------- Gallery filters (with aria + rebuild slider) -------- */
    const chips = $$('.chip');
    chips.forEach(ch=>{
      on(ch,'click', ()=>{
        chips.forEach(c=>{ c.classList.remove('active'); c.setAttribute('aria-pressed','false'); });
        ch.classList.add('active'); ch.setAttribute('aria-pressed','true');
        const tag = ch.dataset.filter;
        $$('#masonry .masonry-item').forEach(it=>{
          const show = (tag==='all' || (it.dataset.tags||'').includes(tag));
          it.style.display = show ? '' : 'none';
        });
        // refresh slider if in mobile mode
        if (window.matchMedia('(max-width: 640px)').matches) {
          if (typeof window.CoreGallerySlider?.rebuild === 'function') window.CoreGallerySlider.rebuild();
        }
      });
    });

    /* -------- Testimonials pager ---------- */
    const dots = $$('.dot');
    const testiGrid = $('#testiGrid');
    function showPage(p){
      const cards = Array.from(testiGrid.children);
      cards.forEach((el,i)=>{ el.hidden = (p===0) ? (i>2) : (i<3); });
      testiGrid.dataset.page = String(p);
      dots.forEach((d,idx)=>{ d.classList.toggle('active', idx===p); d.setAttribute('aria-selected', idx===p ? 'true':'false'); });
    }
    dots.forEach(d=>on(d,'click', ()=>showPage(Number(d.dataset.goto))));
    showPage(0);

    /* ---------- Mobile Gallery Slider (swipe + arrows + dots + keyboard) ---------- */
    (function(){
      const mq = window.matchMedia('(max-width: 640px)');
      const scroller = $('#masonry');
      const dotsWrap = $('#gDots');
      const prevBtn = $('#gPrev');
      const nextBtn = $('#gNext');

      let slides = [];
      let idx = 0;
      let active = false;
      let snapLock = false;

      function visibleSlides(){
        return $$('.masonry-item', scroller).filter(el => el.style.display !== 'none');
      }

      function buildDots(){
        dotsWrap.innerHTML = '';
        slides = visibleSlides();
        slides.forEach((_, i)=>{
          const b = document.createElement('button');
          b.type='button'; b.className='g-dot' + (i===idx ? ' active':'');
          b.addEventListener('click', ()=>goTo(i));
          b.setAttribute('aria-label', `Go to slide ${i+1}`);
          dotsWrap.appendChild(b);
        });
      }

      function goTo(newIdx){
        if(!slides.length) return;
        idx = Math.max(0, Math.min(newIdx, slides.length-1));
        const target = slides[idx];
        if(!target) return;
        snapLock = true;
        scroller.scrollTo({ left: target.offsetLeft - scroller.offsetLeft - 6, behavior:'smooth' });
        requestAnimationFrame(()=>setTimeout(()=>{ snapLock=false; updateDots(); }, 300));
      }

      function updateDots(){
        $$('.g-dot', dotsWrap).forEach((b,i)=>b.classList.toggle('active', i===idx));
      }

      function nearestIndex(){
        if(!slides.length) return 0;
        const center = scroller.scrollLeft + scroller.clientWidth/2;
        let best = 0, bestDist = Infinity;
        slides.forEach((el,i)=>{
          const mid = el.offsetLeft + el.offsetWidth/2;
          const d = Math.abs(mid - center);
          if(d < bestDist){ bestDist = d; best = i; }
        });
        return best;
      }

      function onScroll(){
        if(snapLock) return;
        const n = nearestIndex();
        if(n !== idx){ idx = n; updateDots(); }
      }

      function enable(){
        if(active) return;
        active = true;
        scroller.addEventListener('scroll', onScroll, { passive:true });
        prevBtn?.addEventListener('click', onPrev);
        nextBtn?.addEventListener('click', onNext);
        scroller.setAttribute('role','region');
        scroller.setAttribute('aria-label','Image gallery slider');
        scroller.tabIndex = 0;
        idx = 0; buildDots(); goTo(0);
      }
      function disable(){
        if(!active) return;
        active = false;
        scroller.removeEventListener('scroll', onScroll);
        prevBtn?.removeEventListener('click', onPrev);
        nextBtn?.removeEventListener('click', onNext);
        dotsWrap.innerHTML = '';
        scroller.removeAttribute('role'); scroller.removeAttribute('aria-label'); scroller.tabIndex = -1;
      }
      function onPrev(){ goTo(idx-1); }
      function onNext(){ goTo(idx+1); }

      // keyboard nav
      on(scroller,'keydown', (e)=>{
        if(!active) return;
        if(e.key === 'ArrowLeft'){ e.preventDefault(); onPrev(); }
        if(e.key === 'ArrowRight'){ e.preventDefault(); onNext(); }
      });

      function sync(){ mq.matches ? enable() : disable(); }
      window.addEventListener('resize', sync);
      sync();

      // expose a rebuild hook for filters
      window.CoreGallerySlider = {
        rebuild(){
          if(!mq.matches) return;
          idx = 0; buildDots(); goTo(0);
        }
      };
    })();