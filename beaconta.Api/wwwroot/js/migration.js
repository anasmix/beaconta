(function () {
  'use strict';
  const $ = jQuery;
  let dt;
  let state = {
    yearFrom: 2024,
    yearTo: 2025,
    schoolId: 1,
    scope: 'all',
    strategy: 'simple',
    passAvg: 60,
    failMax: 2,
    copyItems: 'all',
    increase: 5,
    carryDebts: true,
    busAuto: true,
    rows: [],
    conflicts: []
  };

  // ==== INIT UI ====
  $(init);
  function init() {
    // fills selects
    fillYears('#ddlYearFrom', Mock.years, state.yearFrom);
    fillYears('#ddlYearTo', Mock.years, state.yearTo);
    fillSchools('#ddlSchool', Mock.schools, state.schoolId);

    // select2
    $('#ddlYearFrom,#ddlYearTo,#ddlSchool,#ddlScope,#ddlCopyItems').select2({ theme: 'bootstrap-5', minimumResultsForSearch: Infinity });

    // events
    $('#ddlYearFrom').on('change', e => { state.yearFrom = +e.target.value; recalc(); });
    $('#ddlYearTo').on('change', e => { state.yearTo = +e.target.value; recalc(); });
    $('#ddlSchool').on('change', e => { state.schoolId = +e.target.value; recalc(); });
    $('#ddlScope').on('change', e => { state.scope = e.target.value; recalc(); });
    $('input[name="strategy"]').on('change', e => toggleStrategy(e.target.value));
    $('#txtPassAvg').on('input', e => { state.passAvg = +e.target.value || 0; if(state.strategy==='rules') recalc(); });
    $('#txtFailMax').on('input', e => { state.failMax = +e.target.value || 0; if(state.strategy==='rules') recalc(); });
    $('#ddlCopyItems').on('change', e => { state.copyItems = e.target.value; updateKpis(); });
    $('#txtIncrease').on('input', e => { state.increase = +e.target.value || 0; updateKpis(); });
    $('#chkCarryDebts').on('change', e => { state.carryDebts = e.target.checked; updateKpis(); });
    $('#chkBusAuto').on('change', e => { state.busAuto = e.target.checked; });

    $('#btnPresetLenient').on('click', () => { $('#txtPassAvg').val(55).trigger('input'); $('#txtFailMax').val(3).trigger('input'); });
    $('#btnPresetStrict').on('click', () => { $('#txtPassAvg').val(65).trigger('input'); $('#txtFailMax').val(1).trigger('input'); });

    $('#btnSimulate').on('click', simulate);
    $('#btnQuickPromote').on('click', () => { simulate(); doPromote(); });
    $('#btnPromote').on('click', doPromote);
    $('#btnResolveConflicts').on('click', showConflicts);
    $('#btnApplyResolutions').on('click', applyResolutions);
    $('#btnExportPlan').on('click', exportCsv);
    $('#btnDemoReset').on('click', () => { location.reload(); });

    $('#togglePreview').on('change', toggleAdvancedColumns);

    buildTable([]);
    recalc();
    toggleStrategy('simple'); // default
  }

  function fillYears(sel, items, val) {
    const $s = $(sel).empty();
    for (const y of items) $s.append(`<option value="${y.id}">${y.name}</option>`);
    $s.val(val);
  }
  function fillSchools(sel, items, val) {
    const $s = $(sel).empty();
    for (const s of items) $s.append(`<option value="${s.id}">${s.name}</option>`);
    $s.val(val);
  }

  function toggleStrategy(v) {
    state.strategy = v;
    $('#rulesBox').toggleClass('d-none', v !== 'rules');
    recalc();
  }

  // ==== Recalc rows ====
  function recalc() {
    const inScope = Mock.students.filter(s => s.schoolId === state.schoolId);
    const filtered = inScope.filter(s => {
      if (state.scope === 'withContracts') return s.hasContract;
      if (state.scope === 'withoutContracts') return !s.hasContract;
      if (state.scope === 'debtOnly') return s.balance > 0;
      return true;
    });

    // compute suggestion
    const rows = filtered.map(s => {
      const currentGrade = Mock.grades.find(g => g.id === s.gradeId);
      const currentStage = Mock.stages.find(st => st.id === currentGrade.stageId);
      const destGradeId = suggestDestGrade(s);
      const destGrade = destGradeId ? Mock.grades.find(g => g.id === destGradeId) : null;
      const destStage = destGrade ? Mock.stages.find(st => st.id === destGrade.stageId) : null;
      const status = buildStatus(s, destGradeId);

      const increaseFactor = 1 + (state.increase/100);
      const newTotal = s.hasContract && state.copyItems !== 'none'
        ? Math.round((state.copyItems==='tuition' ? s.contractTotal * 0.8 : s.contractTotal) * increaseFactor)
        : 0;
      const newBalance = state.carryDebts ? s.balance : 0;

      return {
        id: s.id,
        name: s.name,
        cur: `${currentStage.name} / ${currentGrade.name} — ${sectionName(s.sectionId)}`,
        dest: destGrade ? `${destStage.name} / ${destGrade.name}` : 'يتخرج',
        avg: s.avg, fails: s.fails,
        hasContract: s.hasContract,
        contractTotal: s.contractTotal,
        balance: s.balance,
        suggestion: destGradeId,
        newTotal,
        newBalance,
        bus: s.bus,
        status
      };
    });

    state.rows = rows;
    updateKpis();
    renderTable(rows);
  }

  function suggestDestGrade(s) {
    if (state.strategy === 'manual') return s.gradeId; // manual: keep until user edits
    if (state.strategy === 'rules') {
      const pass = (s.avg >= state.passAvg) && (s.fails <= state.failMax);
      return pass ? Mock.nextGradeId(s.gradeId) : s.gradeId; // stay if fail
    }
    // simple
    return Mock.nextGradeId(s.gradeId);
  }

  function buildStatus(s, destGradeId) {
    if (!destGradeId) return { key:'ok', text:'يتخرج', badge:'ok' };
    // conflicts: capacity & missing bus if requested
    let issues = [];
    // capacity check on target grade sections (simplified)
    const conflictCap = (gId) => {
      // only for grade 302 scientific (section 9) to simulate conflicts
      if (gId === 302 && s.avg >= 60) { // tends to scientific
        const cap = Mock.capacities.find(c => c.sectionId === 9);
        return cap && cap.capacity <= 0;
      }
      return false;
    };
    if (conflictCap(destGradeId)) issues.push('سعة الشعبة ممتلئة');
    if (state.busAuto && !s.bus) issues.push('حافلة غير محددة');
    if (issues.length) return { key:'conflict', text: issues.join('، '), badge:'err' };
    if (state.strategy === 'rules' && s.avg < state.passAvg) return { key:'warn', text:'لم يحقق شرط النجاح', badge:'warn' };
    return { key:'ok', text:'جاهز', badge:'ok' };
  }

  function sectionName(id) {
    const sec = Mock.sections.find(x => x.id === id);
    return sec ? `شعبة ${sec.name}` : '';
  }

  // ==== Table ====
  function buildTable(rows) {
    if (dt) { dt.clear().rows.add(rows).draw(); return; }
    dt = $('#tblPreview').DataTable({
      data: rows,
      columns: [
        { data: 'name' },
        { data: 'cur' },
        { data: 'dest' },
        { data: 'avg', render: d => d.toFixed(1) },
        { data: 'fails' },
        { data: 'hasContract', render: d => d ? '<span class="badge text-bg-primary">نعم</span>' : '<span class="badge text-bg-secondary">لا</span>' },
        { data: 'contractTotal', render: d => d ? d.toLocaleString('ar-EG') : '—' },
        { data: 'balance', render: d => d===0 ? '—' : (d>0 ? `<span class="text-danger">${d.toLocaleString('ar-EG')}</span>` : `<span class="text-success">${d.toLocaleString('ar-EG')}</span>`) },
        { data: 'status', render: s => `<span class="badge badge-status ${s.badge}">${s.text}</span>` },
        {
          data: null,
          orderable: false,
          render: (_, __, row) => {
            return `<div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary btn-sm btn-edit" data-id="${row.id}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-outline-danger btn-sm btn-remove" data-id="${row.id}"><i class="bi bi-x"></i></button>
            </div>`;
          }
        }
      ],
      order: [[3,'desc']],
      responsive: true,
      language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json' },
      createdRow: (row, data) => {
        if (data.status.key === 'conflict') $(row).addClass('row-conflict');
        else if (data.status.key === 'ok') $(row).addClass('row-eligible');
      }
    });

    $('#tblPreview tbody').on('click', '.btn-remove', function() {
      const id = +$(this).data('id');
      state.rows = state.rows.filter(r => r.id !== id);
      dt.row($(this).closest('tr')).remove().draw();
      updateKpis();
    });

    $('#tblPreview tbody').on('click', '.btn-edit', function() {
      const id = +$(this).data('id');
      const row = state.rows.find(r => r.id === id);
      if (!row) return;
      Swal.fire({
        title: 'تعديل الوجهة المقترحة',
        html: buildGradeSelect(row.suggestion),
        focusConfirm: false,
        preConfirm: () => {
          const v = +document.getElementById('ddlDest').value;
          return v;
        },
        confirmButtonText: 'حفظ',
        cancelButtonText: 'إلغاء',
        showCancelButton: true
      }).then(res => {
        if (res.isConfirmed) {
          row.suggestion = res.value;
          row.dest = res.value ? gradePath(res.value) : 'يتخرج';
          // recompute status
          const stu = Mock.students.find(s => s.id === row.id);
          row.status = buildStatus(stu, row.suggestion);
          renderTable(state.rows);
          updateKpis();
        }
      });
      setTimeout(() => $('#ddlDest').select2({ theme:'bootstrap-5' }), 0);
    });
  }

  function gradePath(gradeId) {
    const g = Mock.grades.find(x => x.id === gradeId);
    const st = g ? Mock.stages.find(s => s.id === g.stageId) : null;
    return g && st ? `${st.name} / ${g.name}` : '';
  }

  function buildGradeSelect(selected) {
    const opts = Mock.grades.map(g => {
      const st = Mock.stages.find(s => s.id === g.stageId);
      return `<option value="${g.id}" ${selected===g.id?'selected':''}>${st.name} — ${g.name}</option>`;
    }).join('');
    return `<select id="ddlDest" class="form-select">${opts}<option value="">يتخرج</option></select>`;
  }

  function renderTable(rows) {
    if (!dt) { buildTable(rows); return; }
    dt.clear().rows.add(rows).draw();
  }

  // ==== KPIs & Conflicts ====
  function updateKpis() {
    const total = state.rows.length;
    $('#kpiInScope').text(total);
    $('#kpiInScopeSub').text('جميع الطلاب ضمن المعايير المحددة');

    const eligible = state.rows.filter(r => r.status.key !== 'conflict').length;
    $('#kpiEligible').text(eligible);
    $('#kpiEligibleSub').text(`${Math.round((eligible/Math.max(total,1))*100)}% جاهزون`);

    const conflicts = state.rows.filter(r => r.status.key === 'conflict');
    state.conflicts = conflicts;
    $('#kpiConflicts').text(conflicts.length);
    $('#kpiConflictsSub').text(conflicts.length? 'اضغط "حل التعارضات" لمعالجتها' : 'لا توجد تعارضات');

    const withContracts = state.rows.filter(r => r.hasContract).length;
    const plannedContracts = state.rows.filter(r => r.newTotal > 0).length;
    $('#kpiContracts').text(`${plannedContracts}/${withContracts}`);
    const sum = state.rows.reduce((a, r) => a + (r.newTotal || 0), 0);
    $('#kpiContractsSub').text(`إجمالي عقود مقترحة: ${sum.toLocaleString('ar-EG')} دينار`);
  }

  function simulate() {
    $('#progressText').text('جاري المحاكاة...');
    $('#progressBar').css('width','30%');
    setTimeout(() => {
      $('#progressBar').css('width','100%');
      $('#progressText').text('تم حساب الخطة المقترحة.');
      Swal.fire({ icon:'success', title:'تمت المحاكاة', text:'الخطة جاهزة للمراجعة.', timer:1400, showConfirmButton:false });
    }, 500);
  }

  function doPromote() {
    const ok = state.rows.filter(r => r.status.key !== 'conflict');
    if (!ok.length) {
      Swal.fire({ icon:'warning', title:'لا عناصر جاهزة', text:'عالج التعارضات أولاً.' });
      return;
    }
    Swal.fire({
      icon:'question',
      title:'تنفيذ الترحيل (تجريبي)',
      html:`سيتم ترحيل <b>${ok.length}</b> طالباً في الواجهة فقط (لا يوجد باك-إند). هل تريد المتابعة؟`,
      showCancelButton: true,
      confirmButtonText: 'نعم، تابع',
      cancelButtonText: 'إلغاء'
    }).then(res => {
      if (res.isConfirmed) {
        $('#progressText').text('تم التنفيذ (تجريبي)');
        Swal.fire({ icon:'success', title:'تم', text:'تم ترحيل الطلاب (واجهة فقط).' });
      }
    });
  }

  function showConflicts() {
    if (!state.conflicts.length) {
      Swal.fire({ icon:'info', title:'لا تعارضات', text:'كل شيء يبدو جيداً.' });
      return;
    }
    const $c = $('#conflictContainer').empty();
    state.conflicts.forEach(r => {
      $c.append(`<div class="border rounded p-2">
        <div class="d-flex justify-content-between align-items-center">
          <div><b>${r.name}</b> — <span class="small text-muted">${r.cur}</span></div>
          <span class="badge badge-status ${r.status.badge}">${r.status.text}</span>
        </div>
        <div class="row g-2 mt-1">
          <div class="col-12 col-md-8">
            <label class="form-label small">اختر وجهة بديلة</label>
            ${buildGradeSelect(r.suggestion)}
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label small">الحافلة</label>
            <input class="form-control form-control-sm" value="${r.bus || ''}" placeholder="رقم/رمز الحافلة">
          </div>
        </div>
      </div>`);
    });
    const mdl = new bootstrap.Modal(document.getElementById('mdlResolve'));
    mdl.show();
    setTimeout(() => $('#conflictContainer select').select2({ theme:'bootstrap-5' }), 0);
  }

  function applyResolutions() {
    // read from modal UI
    $('#conflictContainer > div').each(function(i, el) {
      const ddl = $(el).find('select')[0];
      const newGrade = +ddl.value || null;
      const name = $(el).find('b').text().trim();
      const row = state.rows.find(r => r.name === name);
      if (row) {
        row.suggestion = newGrade;
        row.dest = newGrade ? gradePath(newGrade) : 'يتخرج';
        const stu = Mock.students.find(s => s.id === row.id);
        row.status = buildStatus(stu, row.suggestion);
      }
    });
    renderTable(state.rows);
    updateKpis();
    Swal.fire({ icon:'success', title:'تم', text:'تم تطبيق الحلول.' });
  }

  function toggleAdvancedColumns() {
    const show = $('#togglePreview').is(':checked');
    const cols = [3,4,6,7]; // avg, fails, total, balance
    cols.forEach(i => dt.column(i).visible(show));
  }

  // ==== Export ====
  function exportCsv() {
    const rows = state.rows.map(r => ({
      Student: r.name,
      Current: r.cur,
      Destination: r.dest,
      Avg: r.avg,
      Fails: r.fails,
      HasContract: r.hasContract ? 'Yes' : 'No',
      NewContractTotal: r.newTotal,
      NewBalance: r.newBalance,
      Status: r.status.text
    }));
    const csv = toCsv(rows);
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promotion-plan.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function toCsv(arr) {
    if (!arr.length) return '';
    const cols = Object.keys(arr[0]);
    const escape = v => (`${v}`).replace(/"/g,'""');
    const head = cols.map(c => `"${escape(c)}"`).join(',');
    const body = arr.map(o => cols.map(k => `"${escape(o[k])}"`).join(',')).join('\n');
    return head + '\n' + body;
  }

})();