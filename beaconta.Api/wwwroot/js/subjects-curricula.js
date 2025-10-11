(function(){
  'use strict';
    const $ = jQuery;
    const U = (function () {
        if (window.Utils) return window.Utils;
        console.warn('[subjects-curricula] window.Utils غير موجود. تفعيل بدائل مؤقتة.');
        return {
            useLatinDigits: function () { /* no-op */ },
            toLatinDigits: function (s) { return String(s); },
            select2: function ($el, placeholder) {
                if ($el && $el.select2) {
                    $el.select2({
                        theme: 'bootstrap-5', width: '100%', placeholder: placeholder || '— اختر —',
                        language: { noResults: () => 'لا توجد نتائج', searching: () => 'جارِ التحميل...' }
                    });
                }
            },
            toastOk: (m) => Swal?.fire?.({ icon: 'success', title: 'تم', text: m, timer: 1200, showConfirmButton: false }) ?? alert('تم: ' + m),
            toastErr: (m) => Swal?.fire?.({ icon: 'error', title: 'خطأ', text: m }) ?? alert('خطأ: ' + m),
            confirmDanger: (title, text) => Swal?.fire?.({ icon: 'warning', title, text, showCancelButton: true, confirmButtonText: 'نعم، تابع', cancelButtonText: 'رجوع' })
                ?? Promise.resolve({ isConfirmed: confirm((title || '') + '\n' + (text || '')) })
        };
    })();

    // ✳️ انقل أول استخدام لـ Utils إلى بعد DOMReady لضمان التحميل
    $(function () {
        U.useLatinDigits(true);
    });
  // DOM
  const $selBranch   = $('#selBranch');
  const $selYear     = $('#selYear');
  const $selStage    = $('#selStage');
  const $selGrade    = $('#selGrade');
  const $selSection  = $('#selSection');
  const $btnReload   = $('#btnReload');

  const $tblSubjects = $('#tblSubjects');
  const $tblTemplates= $('#tblTemplates');
  const $tblAssign   = $('#tblAssignments');

  const $dlgSubject  = new bootstrap.Modal('#dlgSubject');
  const $dlgTemplate = new bootstrap.Modal('#dlgTemplate');
  const $frmSubject  = $('#frmSubject');
  const $frmTemplate = $('#frmTemplate');
  const $tplSubjects = $('#tplSubjects');
  const $tplYear     = $('#tplYear');

  const $kpiYears    = $('#kpiYears');
  const $kpiStages   = $('#kpiStages');
  const $kpiSubjects = $('#kpiSubjects');
  const $kpiTemplates= $('#kpiTemplates');
  const $footerSummary = $('#footerSummary');

  const $selAssignGrade = $('#selAssignGrade');
  const $selAssignTemplate = $('#selAssignTemplate');
  const $btnAssign = $('#btnAssign');

  U.useLatinDigits(true);
  U.select2($selBranch, 'اختر مدرسة/فرع');
  U.select2($selYear, 'اختر السنة الدراسية');
  U.select2($selStage, 'اختر المرحلة');
  U.select2($selGrade, 'اختر الصف');
  U.select2($selSection, 'اختر الشعبة');
  U.select2($tplSubjects, 'اختر مواد القالب');
  U.select2($tplYear, 'اختر السنة');
  U.select2($selAssignGrade, 'اختر صفاً');
  U.select2($selAssignTemplate, 'اختر قالباً');

  let dtSubjects, dtTemplates, dtAssign;

  // Endpoints (mocked by Api)
  const END = {
    schools: '/schools?simple=true',
    branchesBySchool: (schoolId)=> `/branches?schoolId=${schoolId||''}`,
    yearsCurrent: (branchId)=> `/school-years/current${branchId?`?branchId=${branchId}`:''}`,
    stages: (schoolId)=> `/stages?schoolId=${schoolId||''}`,
    grades: '/gradeyears',
    sectionsByGrade: (gradeYearId)=> `/sectionyears/by-grade/${gradeYearId}`,
    subjects: '/subjects',
    templates: '/curriculumtemplates',
    tplSubjects: (id)=> `/curriculumtemplates/${id}/subjects`,
    assignments: '/assignments'
  };

  function qp(params){
    const q = Object.entries(params||{})
      .filter(([_,v])=> v !== undefined && v !== null && v !== '')
      .map(([k,v])=> `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    return q ? ('?'+q) : '';
  }

  // =================== Filters ===================
  async function loadBranches(){
    $selBranch.prop('disabled', true).empty();
    const schools = await Api.get(END.schools);
    const options = [];
    (schools||[]).forEach(s=>{
      options.push(new Option(`🟦 ${s.name}`, `school:${s.id}`));
    });
    const branches = await Api.get('/branches');
    (branches||[]).forEach(b=> options.push(new Option(`- ${b.name}`, b.id)));
    $selBranch.append(new Option('— اختر —',''));
    options.forEach(o=> $selBranch.append(o));
    $selBranch.prop('disabled', false).val('').trigger('change');
  }

  async function loadYears(branchId){
    $selYear.prop('disabled', true).empty();
    const res = await Api.get(END.yearsCurrent(branchId || ''));
    const years = Array.isArray(res) ? res : (res ? [res] : []);
    $selYear.append(new Option('— اختر —',''));
    years.forEach(y=> $selYear.append(new Option(`${y.name}`, y.id)));
    $selYear.prop('disabled', false).trigger('change');
    $kpiYears.text(years.length);
  }

  async function loadStages(schoolId){
    $selStage.prop('disabled', true).empty();
    const data = await Api.get(END.stages(schoolId||''));
    $selStage.append(new Option('— اختر —',''));
    (data||[]).forEach(x=> $selStage.append(new Option(x.name, x.id)));
    $selStage.prop('disabled', false).trigger('change');
    $kpiStages.text((data||[]).length);
  }

  async function loadGrades(){
    $selGrade.prop('disabled', true).empty();
    const data = await Api.get(END.grades);
    $selGrade.append(new Option('— اختر —',''));
    (data||[]).forEach(x=> $selGrade.append(new Option(x.name, x.id)));
    $selGrade.prop('disabled', false).trigger('change');
    // assign tab
    $selAssignGrade.empty(); (data||[]).forEach(x=> $selAssignGrade.append(new Option(x.name, x.id))); $selAssignGrade.trigger('change');
  }

  async function loadSections(gradeYearId){
    $selSection.prop('disabled', true).empty();
    if(!gradeYearId){
      $selSection.append(new Option('— اختر —','')).prop('disabled',false).trigger('change'); 
      return;
    }
    const data = await Api.get(END.sectionsByGrade(gradeYearId));
    $selSection.append(new Option('— اختر —',''));
    (data||[]).forEach(x=> $selSection.append(new Option(x.name, x.id)));
    $selSection.prop('disabled', false).trigger('change');
  }

  // =================== Subjects ===================
  async function loadSubjects(){
    const query = {
      yearId: $selYear.val() || undefined,
      stageId: $selStage.val() || undefined,
      gradeYearId: $selGrade.val() || undefined
    };
    const data = await Api.get(END.subjects + qp(query));
    if(!dtSubjects){
      dtSubjects = window.Tables.make($tblSubjects, {
        rowId: 'id',
        columns: [
          { title:'#', data:null, render:(d,t,r,meta)=> meta.row+1, width:'32px' },
          { title:'الرمز', data:'code' },
          { title:'الاسم', data:'name' },
          { title:'ملاحظات', data:'note', defaultContent:'—' },
          { title:'', data:null, orderable:false, className:'text-center', width:'160px',
            render:(row)=> `
              <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-id="${row.id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}"><i class="bi bi-trash"></i></button>`
          }
        ],
        data: data || []
      });
      $tblSubjects.on('click','.btn-edit', onEditSubject);
      $tblSubjects.on('click','.btn-del', onDeleteSubject);
    }else{
      dtSubjects.clear().rows.add(data||[]).draw();
    }
    $kpiSubjects.text((data||[]).length);
  }

  function getSubjectById(id){ return (dtSubjects ? dtSubjects.rows().data().toArray() : []).find(x=>x.id===id); }

  // CRUD Subject
  async function onEditSubject(e){
    const id = $(e.currentTarget).data('id');
    const row = dtSubjects.row('#'+id).data() || dtSubjects.rows().data().toArray().find(x=>x.id===id);
    window.Forms.reset($frmSubject);
    window.Forms.fill($frmSubject, { Id: row.id, Code: row.code, Name: row.name, Note: row.note });
    $dlgSubject.show();
  }
  $('#btnNewSubject').on('click', ()=>{ window.Forms.reset($frmSubject); $frmSubject.find('[name="Id"]').val(0); $dlgSubject.show(); });
  $('#btnSaveSubject').on('click', async ()=>{
    const payload = window.Forms.serialize($frmSubject);
    const id = Number(payload.Id||0);
    try{
      if(id>0) await Api.put('/subjects/'+id, payload);
      else await Api.post('/subjects', payload);
      U.toastOk('تم حفظ المادة.');
      $dlgSubject.hide(); loadSubjects(); refreshAssignSelectors(); // update selectors
    }catch(err){ U.toastErr('تعذر حفظ المادة.'); console.error(err); }
  });
  async function onDeleteSubject(e){
    const id = $(e.currentTarget).data('id');
    const ok = await U.confirmDanger('حذف مادة','هل أنت متأكد من الحذف؟'); if(!ok.isConfirmed) return;
    try{ await Api.delete('/subjects/'+id); U.toastOk('تم الحذف.'); loadSubjects(); refreshAssignSelectors(); }
    catch(err){ U.toastErr('تعذر الحذف.'); console.error(err); }
  }

  // Import/Export CSV
  $('#btnExportSubjects').on('click', async ()=>{
    const rows = dtSubjects ? dtSubjects.rows().data().toArray() : [];
    const csv = ['Id,Code,Name,Note'].concat(rows.map(r=> [r.id,r.code,r.name,(r.note||'')].map(x=> `"${String(x).replace(/"/g,'""')}"`).join(','))).join('\n');
    U.download('subjects.csv', csv, 'text/csv;charset=utf-8');
  });
  $('#btnImportSubjects').on('click', ()=>{
    const inp = document.createElement('input'); inp.type='file'; inp.accept='.csv,text/csv';
    inp.onchange = async ()=>{
      const file = inp.files[0]; if(!file) return;
      const text = await file.text(); const lines = text.split(/\r?\n/).filter(x=>x.trim());
      const head = lines.shift(); // assume header
      for(const line of lines){
        const cols = line.split(',').map(c=> c.replace(/^"|"$/g,'').replace(/""/g,'"'));
        const [,Code,Name,Note] = cols;
        if(!Name) continue;
        await Api.post('/subjects', { Code, Name, Note });
      }
      U.toastOk('تم الاستيراد.');
      loadSubjects(); refreshAssignSelectors();
    };
    inp.click();
  });

  // =================== Templates ===================
  async function loadTemplates(){
    const query = { yearId: $selYear.val() || undefined };
    const templates = await Api.get(END.templates + qp(query));
    if(!dtTemplates){
      dtTemplates = window.Tables.make($tblTemplates, {
        rowId:'id',
        columns: [
          { title:'#', data:null, render:(d,t,r,meta)=> meta.row+1, width:'32px' },
          { title:'الرمز', data:'templateCode' },
          { title:'الاسم', data:'name' },
          { title:'السنة', data:'yearName', defaultContent:'—' },
          { title:'مواد القالب', data:null, render:(r)=>`<span class="badge bg-secondary-subtle text-secondary border">${r.subjectsCount||0}</span>`, width:'100px', className:'text-center' },
          { title:'', data:null, orderable:false, className:'text-center', width:'220px',
            render:(row)=> `
              <button class="btn btn-sm btn-outline-info me-1 btn-map" data-id="${row.id}"><i class="bi bi-list-check"></i></button>
              <button class="btn btn-sm btn-outline-primary me-1 btn-edit" data-id="${row.id}"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}"><i class="bi bi-trash"></i></button>`
          }
        ],
        data: (templates||[])
      });
      // events
      $tblTemplates.on('click','.btn-edit', onEditTemplate);
      $tblTemplates.on('click','.btn-del', onDeleteTemplate);
      $tblTemplates.on('click','.btn-map', onMapTemplateSubjects);
    }else{
      const enriched = (templates||[]);
      dtTemplates.clear().rows.add(enriched).draw();
    }
    // update KPI
    $kpiTemplates.text((templates||[]).length);
  }

  async function enrichTemplatesWithCounts(rows){
    // helper to append subjectsCount
    const copy = [];
    for(const r of rows){
      const subIds = await Api.get(END.tplSubjects(r.id));
      copy.push({...r, subjectsCount: (subIds||[]).length});
    }
    return copy;
  }

  async function reloadTemplatesWithCounts(){
    const query = { yearId: $selYear.val() || undefined };
    let templates = await Api.get(END.templates + qp(query));
    templates = await enrichTemplatesWithCounts(templates);
    if(dtTemplates){ dtTemplates.clear().rows.add(templates).draw(); }
    else {
      // initial setup uses loadTemplates; here ensure counts after creation
      dtTemplates = null; // force rebuild
      await loadTemplates();
    }
  }

  // CRUD Template
  $('#btnNewTemplate').on('click', async ()=>{
    window.Forms.reset($frmTemplate);
    $frmTemplate.find('[name="Id"]').val(0);
    copyYearOptions(); await fillTplSubjects();
    $dlgTemplate.show();
  });

  async function onEditTemplate(e){
    const id = $(e.currentTarget).data('id');
    const row = dtTemplates.row('#'+id).data() || dtTemplates.rows().data().toArray().find(x=>x.id===id);
    copyYearOptions(); await fillTplSubjects();
    window.Forms.reset($frmTemplate);
    window.Forms.fill($frmTemplate, { Id: row.id, TemplateCode: row.templateCode, Name: row.name, YearId: row.yearId });
    // load mapped subjects
    const selected = await Api.get(END.tplSubjects(row.id));
    $('#tplSubjects').val((selected||[]).map(String)).trigger('change');
    $dlgTemplate.show();
  }

  $('#btnSaveTemplate').on('click', async ()=>{
    const payload = window.Forms.serialize($frmTemplate);
    payload.SubjectIds = $('#tplSubjects').val() || [];
    const id = Number(payload.Id||0);
    try{
      let savedId = id;
      if(id>0){ await Api.put('/curriculumtemplates/'+id, payload); }
      else {
        const row = await Api.post('/curriculumtemplates', payload);
        savedId = row.id;
      }
      // map subjects
      await Api.post(`/curriculumtemplates/${savedId}/subjects`, { subjectIds: (payload.SubjectIds||[]).map(Number) });
      U.toastOk('تم حفظ القالب.');
      $dlgTemplate.hide();
      await reloadTemplatesWithCounts();
      refreshAssignSelectors();
    }catch(err){ U.toastErr('تعذر حفظ القالب.'); console.error(err); }
  });

  async function onDeleteTemplate(e){
    const id = $(e.currentTarget).data('id');
    const ok = await U.confirmDanger('حذف قالب','هل أنت متأكد من الحذف؟'); if(!ok.isConfirmed) return;
    try{ await Api.delete('/curriculumtemplates/'+id); U.toastOk('تم الحذف.'); await reloadTemplatesWithCounts(); refreshAssignSelectors(); }
    catch(err){ U.toastErr('تعذر الحذف.'); console.error(err); }
  }

  async function onMapTemplateSubjects(e){
    const id = $(e.currentTarget).data('id');
    const row = dtTemplates.row('#'+id).data() || dtTemplates.rows().data().toArray().find(x=>x.id===id);
    copyYearOptions(); await fillTplSubjects();
    window.Forms.reset($frmTemplate);
    window.Forms.fill($frmTemplate, { Id: row.id, TemplateCode: row.templateCode, Name: row.name, YearId: row.yearId });
    const selected = await Api.get(END.tplSubjects(row.id));
    $('#tplSubjects').val((selected||[]).map(String)).trigger('change');
    $dlgTemplate.show();
  }

  function copyYearOptions(){
    const $src = $selYear; const $dst = $tplYear; $dst.empty(); $dst.append(new Option('— اختر —',''));
    $src.find('option').each(function(){ if(!this.value) return; $dst.append(new Option($(this).text(), this.value)); });
    $dst.val($src.val()).trigger('change');
  }
  async function fillTplSubjects(){
    const q = { yearId:$selYear.val()||undefined, stageId:$selStage.val()||undefined, gradeYearId:$selGrade.val()||undefined };
    const subs = await Api.get('/subjects'+ (function(){const s=new URLSearchParams(q);return s.toString()?`?${s}`:'';})());
    $tplSubjects.empty(); (subs||[]).forEach(s=> $tplSubjects.append(new Option(`${s.name}`, s.id))); $tplSubjects.trigger('change');
  }

  // =================== Assignments (GradeYear ↔ Template) ===================
  async function refreshAssignSelectors(){
    // templates to selector
    const tpls = await Api.get(END.templates);
    $selAssignTemplate.empty(); (tpls||[]).forEach(t=> $selAssignTemplate.append(new Option(`${t.name}`, t.id))); $selAssignTemplate.trigger('change');
  }
  async function loadAssignments(){
    const list = await Api.get(END.assignments);
    // decorate
    const grades = await Api.get(END.grades);
    const tpls = await Api.get(END.templates);
    const rows = (list||[]).map(a=> ({
      id:a.id,
      gradeName: grades.find(g=>g.id===a.gradeYearId)?.name || a.gradeYearId,
      templateName: tpls.find(t=>t.id===a.templateId)?.name || a.templateId
    }));
    if(!dtAssign){
      dtAssign = window.Tables.make($tblAssign, {
        rowId:'id',
        columns: [
          { title:'#', data:null, render:(d,t,r,meta)=> meta.row+1, width:'32px' },
          { title:'الصف', data:'gradeName' },
          { title:'القالب المعين', data:'templateName' },
          { title:'', data:null, orderable:false, className:'text-center', width:'100px',
            render:(row)=> `<button class="btn btn-sm btn-outline-danger btn-del" data-id="${row.id}"><i class="bi bi-trash"></i></button>` }
        ],
        data: rows
      });
      $tblAssign.on('click','.btn-del', onDeleteAssign);
    }else{
      dtAssign.clear().rows.add(rows).draw();
    }
  }
  async function onDeleteAssign(e){
    const id = $(e.currentTarget).data('id');
    const ok = await U.confirmDanger('إلغاء إسناد','هل تريد إلغاء هذا الإسناد؟'); if(!ok.isConfirmed) return;
    await Api.delete('/assignments/'+id); U.toastOk('تم الإلغاء.'); loadAssignments();
  }
  $btnAssign.on('click', async ()=>{
    const gid = Number($selAssignGrade.val()); const tid = Number($selAssignTemplate.val());
    if(!gid||!tid){ U.toastErr('اختر صفاً وقالباً أولاً.'); return; }
    await Api.post('/assignments', { gradeYearId: gid, templateId: tid });
    U.toastOk('تم الإسناد.');
    loadAssignments();
  });

  // =================== Events ===================
  $selBranch.on('change', async function(){
    const v = $(this).val(); const isBranch = v && !String(v).startsWith('school:');
    await loadYears(isBranch ? v : '');
    await loadStages(isBranch ? null : (v ? v.split(':')[1] : null)); // if school selected, pass schoolId
    await loadGrades(); await loadSections(null);
    await reloadAll();
  });
  $selYear.on('change', reloadAll);
  $selStage.on('change', reloadAll);
  $selGrade.on('change', async function(){ await loadSections($(this).val()); await reloadAll(); });
  $selSection.on('change', reloadAll);
  $btnReload.on('click', reloadAll);
  $('#btnSave').on('click', ()=> U.toastOk('لا توجد تغييرات معلّقة حالياً (وضع العرض التجريبي).'));
  $('#btnCancel').on('click', ()=> location.reload());

  async function reloadAll(){
    await Promise.all([loadSubjects(), reloadTemplatesWithCounts(), loadAssignments()]);
    $footerSummary.text('تم تحديث البيانات.');
  }

  // Init
  $(async function init(){
    try{
      await loadBranches(); await refreshAssignSelectors();
    }catch(err){ U.toastErr('تعذر تحميل الفلاتر الأساسية.'); console.error(err); }
  });
})();
