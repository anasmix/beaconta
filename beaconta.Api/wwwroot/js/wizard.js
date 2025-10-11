(function(){
  'use strict';
  const $ = jQuery;

  async function runWizard(ctx){
    // Very light mock wizard: proposes mapping subjects -> bundle items based on keywords
    const subjects = ctx.subjects || [];
    const bundleItems = ctx.bundleItems || [];
    const summary = subjects.map(s=>{
      const matches = bundleItems.filter(b=> /(lab|مختبر|bus|bus)/i.test(b.name||b.title||''));
      return { subject: s.name, suggestedItems: matches.map(m=>m.name||m.title) };
    });
    const html = summary.length? ("<ul class='text-start'>" + summary.map(x=> `<li><b>${x.subject}</b>: ${x.suggestedItems.join('، ')||'—'}</li>`).join('') + "</ul>") : '—';
    await Swal.fire({icon:'info', title:'مساعد الربط الذكي (Mock)', html});
  }

  window.Wizard = { runWizard };
})();