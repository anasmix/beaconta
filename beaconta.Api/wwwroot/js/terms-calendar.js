// /assets/js/terms-calendar.js
(function () {
    'use strict';
    const $ = jQuery;

    // ================== Config ==================
    const API_BASE = '/api'; // عدّلها لو الـ API تحت مسار آخر
    function authHeader() {
        const token = localStorage.getItem('token'); // إن كنت تسجّل التوكِن هنا بعد تسجيل الدخول
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
    async function http(method, url, body) {
        const res = await fetch(url, {
            method,
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', ...authHeader() },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            // حاول قراءة رسالة مفيدة من السيرفر
            let err;
            try { err = await res.json(); } catch { err = { message: res.statusText }; }
            throw Object.assign(new Error(err.message || res.statusText), { status: res.status, details: err });
        }
        // 204 بدون جسم
        if (res.status === 204) return null;
        try { return await res.json(); } catch { return null; }
    }

    // ================== State ==================
    const state = {
        branches: [], // [{id,name}]
        years: [],    // [{id,name,colorHex,branchId,isActive,startDate,endDate}]
        branchId: null,
        yearId: null,
        status: '',   // Active | Inactive | ''
        terms: [],    // UI Model: {id,name,start,end,weekdays:[0..6],status,examStart,examEnd,notes}
        events: []    // UI Model: {id,type,title,start,end,notes}
    };

    // ================== Adapters (DTO <-> UI) ==================
    // DTOs:
    // TermYearDto { id, yearId, name, startDate, endDate, weekdaysCsv, status, examStart, examEnd, notes }
    // CalendarEventDto { id, yearId, type, title, startDate, endDate, notes }

    function dtoTermToUi(t) {
        return {
            id: t.id, name: t.name,
            start: t.startDate?.slice(0, 10), end: t.endDate?.slice(0, 10),
            weekdays: (t.weekdaysCsv || '0,1,2,3,4').split(',').map(n => +n),
            status: t.status, examStart: t.examStart?.slice(0, 10) || '',
            examEnd: t.examEnd?.slice(0, 10) || '', notes: t.notes || ''
        };
    }
    function uiTermToDto(u) {
        return {
            id: u.id || null,
            yearId: state.yearId,
            name: u.name,
            startDate: u.start,
            endDate: u.end,
            weekdaysCsv: (u.weekdays || [0, 1, 2, 3, 4]).join(','),
            status: u.status || 'Active',
            examStart: u.examStart || null,
            examEnd: u.examEnd || null,
            notes: u.notes || null
        };
    }

    function dtoEventToUi(e) {
        return {
            id: e.id, type: e.type, title: e.title,
            start: e.startDate?.slice(0, 10), end: e.endDate?.slice(0, 10),
            notes: e.notes || ''
        };
    }
    function uiEventToDto(u) {
        return {
            id: u.id || null,
            yearId: state.yearId,
            type: u.type, title: u.title,
            startDate: u.start, endDate: u.end,
            notes: u.notes || null
        };
    }

    // ================== Utils (كما كانت) ==================
    function fmtDate(d) { return new Date(d).toISOString().slice(0, 10); }
    function addOneDay(dateStr) { const d = new Date(dateStr); d.setDate(d.getDate() + 1); return d; }
    function businessDays(start, end, weekdays) {
        let c = 0; const s = new Date(start), e = new Date(end);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) { const wd = (d.getDay() + 6) % 7; if (weekdays.includes(wd)) c++; } return c;
    }
    function overlaps(aStart, aEnd, bStart, bEnd) { return !(new Date(aEnd) < new Date(bStart) || new Date(bEnd) < new Date(aStart)); }

    // ================== API calls ==================
    async function loadBranches() {
        // إن كان عندك endpoint مبسّط:
        // GET /api/branches?simple=true -> [{id,name}]
        state.branches = await http('GET', `${API_BASE}/branches?simple=true`);
        if (!state.branchId && state.branches.length) state.branchId = state.branches[0].id;
    }

    async function loadYears() {
        // GET /api/school-years?branchId=x -> YearDto[]
        const list = await http('GET', `${API_BASE}/school-years?branchId=${state.branchId}`);
        // نكيّف للواجهة
        state.years = list.map(y => ({
            id: y.id, name: y.name, branchId: y.branchId,
            colorHex: y.colorHex, isActive: y.isActive,
            startDate: y.startDate, endDate: y.endDate
        }));
        // اختر النشطة أو الأولى
        const active = state.years.find(y => y.isActive);
        state.yearId = active ? active.id : (state.years[0]?.id || null);
        $('#activeYearName').text(active ? active.name : (state.years[0]?.name || '—'));
        $('#activeYearColor').text('لون السنة: ' + ((active?.colorHex || state.years[0]?.colorHex) ? 'محدد' : '—'));
    }

    async function loadTerms() {
        if (!state.yearId) { state.terms = []; return; }
        const list = await http('GET', `${API_BASE}/terms?yearId=${state.yearId}`);
        state.terms = list.map(dtoTermToUi);
    }

    async function loadEvents() {
        if (!state.yearId) { state.events = []; return; }
        const list = await http('GET', `${API_BASE}/calendar-events?yearId=${state.yearId}`);
        state.events = list.map(dtoEventToUi);
    }

    // ================== Bind Filters ==================
    function bindFilters() {
        // branches select
        $('#branch').select2({
            theme: 'bootstrap-5',
            data: state.branches.map(b => ({ id: b.id, text: b.name })), width: '100%'
        }).val(state.branchId).trigger('change');

        $('#branch').on('change', async function () {
            state.branchId = +this.value;
            await loadYears();
            await reloadDataAndRender();
        });

        // years select (لو عندك كومبو للسنة)
        const yearsData = state.years.map(y => ({ id: y.id, text: y.name }));
        $('#schoolYear').select2({ theme: 'bootstrap-5', data: yearsData, width: '100%' })
            .val(state.yearId).trigger('change');

        $('#schoolYear').on('change', async function () {
            state.yearId = +this.value;
            await reloadDataAndRender();
        });

        $('#status').on('change', function () {
            state.status = this.value;
            renderTermsTable(); renderCalendar();
        });
    }

    // ================== Table & Calendar ==================
    let dt = null, calendar;

    function renderTermsTable() {
        const rows = (state.terms || [])
            .filter(t => !state.status || t.status === state.status)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .map(t => ({
                id: t.id, name: t.name, start: t.start, end: t.end,
                days: businessDays(t.start, t.end, t.weekdays || []),
                status: t.status,
                exam: (t.examStart && t.examEnd) ? `${t.examStart} → ${t.examEnd}` : '—',
                notes: t.notes || '—'
            }));

        if (!dt) {
            dt = $('#tblTerms').DataTable({
                data: rows,
                columns: [
                    { title: '#', data: 'id', width: '40px' },
                    { title: 'الفصل', data: 'name' },
                    { title: 'من', data: 'start' },
                    { title: 'إلى', data: 'end' },
                    { title: 'أيام الدراسة', data: 'days', className: 'text-center', width: '110px' },
                    { title: 'الاختبارات', data: 'exam' },
                    {
                        title: 'الحالة', data: 'status', className: 'text-center', width: '90px',
                        render: d => d === 'Active' ? '<span class="badge bg-success">نشط</span>' : '<span class="badge bg-secondary">متوقف</span>'
                    },
                    {
                        title: '', data: null, orderable: false, className: 'text-end', width: '120px',
                        render: (_, __, row) => `
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${row.id}"><i class="bi bi-pencil-square"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-action="del" data-id="${row.id}"><i class="bi bi-trash"></i></button>
              </div>`}
                ],
                language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json' },
                dom: "<'row'<'col-sm-12'tr>>" + "<'d-flex justify-content-between align-items-center mt-2'<'small i><'dt-buttons'B>>",
                buttons: [
                    { extend: 'copyHtml5', text: 'نسخ', className: 'btn btn-light btn-sm' },
                    { extend: 'csvHtml5', text: 'CSV', className: 'btn btn-light btn-sm' }
                ],
                order: [[2, 'asc']]
            });

            $('#tblTerms').on('click', 'button[data-action]', async (e) => {
                const id = +e.currentTarget.dataset.id;
                const action = e.currentTarget.dataset.action;
                if (action === 'edit') openTermModal(id);
                else if (action === 'del') await removeTerm(id);
            });
        } else {
            dt.clear().rows.add(rows).draw();
        }

        // KPIs
        $('#kpiTerms').text(rows.length);
        const exams = state.events.filter(e => e.type === 'Exam').length + state.terms.filter(t => t.examStart && t.examEnd).length;
        $('#kpiExams').text(exams);
        $('#kpiHolidays').text(state.events.filter(e => e.type === 'Holiday').length);
        const studyDaysTotal = state.terms.reduce((s, t) => s + businessDays(t.start, t.end, t.weekdays || []), 0);
        $('#kpiStudyDays').text(studyDaysTotal);
    }

    function renderCalendar() {
        const calEl = document.getElementById('calendar');
        const y = state.years.find(y => y.id === state.yearId);
        const initialDate = y ? (y.startDate || state.terms[0]?.start || new Date()) : new Date();

        const termEvents = (state.terms || [])
            .filter(t => !state.status || t.status === state.status)
            .flatMap(t => {
                const items = [{
                    id: 'term-' + t.id, title: t.name, start: t.start, end: addOneDay(t.end),
                    display: 'background', backgroundColor: '#e8f0ff', borderColor: '#5b8def'
                }];
                if (t.examStart && t.examEnd) {
                    items.push({ id: 'term-exam-' + t.id, title: 'اختبارات ' + t.name, start: t.examStart, end: addOneDay(t.examEnd), color: '#ff9f43' });
                }
                return items;
            });

        const extraEvents = (state.events || [])
            .map(ev => ({
                id: 'ev-' + ev.id, title: ev.title, start: ev.start, end: addOneDay(ev.end),
                color: mapEventColor(ev.type), extendedProps: { type: ev.type, notes: ev.notes }
            }));

        const events = [...termEvents, ...extraEvents];

        if (calendar) { calendar.setOption('events', events); return; }

        calendar = new FullCalendar.Calendar(calEl, {
            locale: 'ar', direction: 'rtl', buttonText: { today: 'اليوم' }, height: 'auto',
            headerToolbar: { start: 'title', center: '', end: 'today dayGridMonth,timeGridWeek,listMonth prev,next' },
            initialView: 'dayGridMonth', initialDate: initialDate, navLinks: true, events,
            eventClick: function (info) {
                const e = info.event;
                const isTerm = String(e.id).startsWith('term-');
                if (isTerm) { const id = +String(e.id).split('-')[1]; openTermModal(id); }
                else {
                    Swal.fire({
                        title: e.title,
                        html: `<div class="text-start">نوع: <b>${e.extendedProps?.type || '—'}</b><br/>من: ${fmtDate(e.start)}<br/>إلى: ${fmtDate(new Date(e.end.getTime() - 86400000))}<br/>ملاحظات: ${e.extendedProps?.notes || '—'}</div>`,
                        showCancelButton: true, confirmButtonText: 'تعديل', cancelButtonText: 'إغلاق'
                    }).then(res => { if (res.isConfirmed) { const id = +String(e.id).split('-')[1]; openEventModal(id); } });
                }
            }
        });
        calendar.render();
    }

    function mapEventColor(type) {
        switch (type) { case 'Holiday': return '#22b07d'; case 'Exam': return '#ff9f43'; case 'Orientation': return '#5b8def'; default: return '#7e8da0'; }
    }

    // ================== Terms CRUD (API) ==================
    function openTermModal(id) {
        const isEdit = !!id;
        const term = isEdit ? state.terms.find(t => t.id === id) : null;
        $('#termModalTitle').text(isEdit ? 'تعديل فصل' : 'فصل جديد');
        $('#termId').val(isEdit ? term.id : '');

        const fixedNames = ['الفصل الأول', 'الفصل الثاني', 'الفصل الصيفي'];
        const namePreset = isEdit && fixedNames.includes(term.name) ? term.name : (isEdit ? 'مخصص' : 'الفصل الأول');
        $('#termName').val(namePreset).trigger('change');
        if (namePreset === 'مخصص') { $('#termNameCustomWrap').removeClass('d-none'); $('#termNameCustom').val(isEdit ? term.name : ''); }
        else { $('#termNameCustomWrap').addClass('d-none'); $('#termNameCustom').val(''); }

        $('#termStart').val(isEdit ? term.start : '');
        $('#termEnd').val(isEdit ? term.end : '');
        $('#termWeekdays').val((isEdit ? term.weekdays : [0, 1, 2, 3, 4]).map(String)).trigger('change');
        $('#termStatus').val(isEdit ? term.status : 'Active');
        const hasExam = isEdit ? (!!term.examStart && !!term.examEnd) : false;
        $('#termExamPeriod').prop('checked', hasExam).trigger('change');
        $('#examStart').val(isEdit ? (term.examStart || '') : '');
        $('#examEnd').val(isEdit ? (term.examEnd || '') : '');
        $('#termNotes').val(isEdit ? (term.notes || '') : '');

        recalcTerm();
        new bootstrap.Modal(document.getElementById('modalTerm')).show();
    }

    async function removeTerm(id) {
        const t = state.terms.find(x => x.id === id);
        const r = await Swal.fire({ title: 'حذف الفصل؟', text: t?.name || '', icon: 'warning', showCancelButton: true, confirmButtonText: 'حذف', cancelButtonText: 'تراجع' });
        if (!r.isConfirmed) return;

        await http('DELETE', `${API_BASE}/terms/${id}`);
        state.terms = state.terms.filter(x => x.id !== id);
        renderTermsTable(); renderCalendar();
        Swal.fire('تم الحذف', 'تم حذف الفصل بنجاح', 'success');
    }

    function recalcTerm() {
        const s = $('#termStart').val(), e = $('#termEnd').val();
        const w = ($('#termWeekdays').val() || []).map(Number);
        if (s && e) $('#termCalc').text(`عدد أيام الدراسة المتوقعة: ${businessDays(s, e, w)}`);
        else $('#termCalc').text('');
    }

    async function saveTerm() {
        const id = +($('#termId').val() || 0);
        const nameSel = $('#termName').val();
        const name = nameSel === 'مخصص' ? ($('#termNameCustom').val() || 'مخصص') : nameSel;
        const start = $('#termStart').val();
        const end = $('#termEnd').val();
        const weekdays = ($('#termWeekdays').val() || []).map(Number);
        const status = $('#termStatus').val();
        const hasExam = $('#termExamPeriod').is(':checked');
        const examStart = hasExam ? $('#examStart').val() : '';
        const examEnd = hasExam ? $('#examEnd').val() : '';
        const notes = $('#termNotes').val();

        if (!name || !start || !end) return Swal.fire('تنبيه', 'يرجى تعبئة الحقول الأساسية', 'warning');
        if (new Date(end) < new Date(start)) return Swal.fire('تنبيه', 'تاريخ النهاية قبل البداية', 'warning');

        const ui = { id, name, start, end, weekdays, status, examStart, examEnd, notes };
        const dto = uiTermToDto(ui);

        try {
            const saved = id
                ? await http('PUT', `${API_BASE}/terms/${id}`, dto)
                : await http('POST', `${API_BASE}/terms`, dto);
            const uiSaved = dtoTermToUi(saved);
            if (id) {
                const ix = state.terms.findIndex(x => x.id === id);
                if (ix >= 0) state.terms[ix] = uiSaved;
            } else {
                state.terms.push(uiSaved);
            }
            renderTermsTable(); renderCalendar();
            bootstrap.Modal.getInstance(document.getElementById('modalTerm')).hide();
            Swal.fire('تم الحفظ', 'تم حفظ الفصل بنجاح', 'success');
        } catch (err) {
            if (err.status === 409 && err.details?.code === 'TERM_OVERLAP')
                Swal.fire('تعارض تواريخ', 'نطاق الفصل يتعارض مع فصل آخر', 'error');
            else if (err.status === 400 && err.details?.errors)
                Swal.fire('تنبيه', 'الحقول غير صحيحة', 'warning');
            else
                Swal.fire('خطأ', err.message || 'تعذر الحفظ', 'error');
        }
    }

    // ================== Events CRUD (API) ==================
    function openEventModal(id) {
        const isEdit = !!id; const ev = isEdit ? state.events.find(e => e.id === id) : null;
        $('#eventId').val(isEdit ? ev.id : '');
        $('#eventType').val(isEdit ? ev.type : 'Holiday');
        $('#eventTitle').val(isEdit ? ev.title : '');
        $('#eventStart').val(isEdit ? ev.start : '');
        $('#eventEnd').val(isEdit ? ev.end : '');
        $('#eventNotes').val(isEdit ? ev.notes : '');
        new bootstrap.Modal(document.getElementById('modalEvent')).show();
    }

    async function saveEvent() {
        const id = +($('#eventId').val() || 0);
        const type = $('#eventType').val();
        const title = $('#eventTitle').val();
        const start = $('#eventStart').val();
        const end = $('#eventEnd').val();
        const notes = $('#eventNotes').val();
        if (!title || !start || !end) return Swal.fire('تنبيه', 'يرجى تعبئة جميع الحقول', 'warning');
        if (new Date(end) < new Date(start)) return Swal.fire('تنبيه', 'تاريخ النهاية قبل البداية', 'warning');

        const ui = { id, type, title, start, end, notes };
        const dto = uiEventToDto(ui);
        try {
            const saved = id
                ? await http('PUT', `${API_BASE}/calendar-events/${id}`, dto)
                : await http('POST', `${API_BASE}/calendar-events`, dto);
            const uiSaved = dtoEventToUi(saved);
            if (id) {
                const ix = state.events.findIndex(x => x.id === id);
                if (ix >= 0) state.events[ix] = uiSaved;
            } else {
                state.events.push(uiSaved);
            }
            renderTermsTable(); renderCalendar();
            bootstrap.Modal.getInstance(document.getElementById('modalEvent')).hide();
            Swal.fire('تم الحفظ', 'تم حفظ الحدث', 'success');
        } catch (err) {
            Swal.fire('خطأ', err.message || 'تعذر الحفظ', 'error');
        }
    }

    async function removeEvent(id) {
        await http('DELETE', `${API_BASE}/calendar-events/${id}`);
        state.events = state.events.filter(x => x.id !== id);
        renderTermsTable(); renderCalendar();
        Swal.fire('تم الحذف', 'تم حذف الحدث', 'success');
    }

    // ================== Init ==================
    async function reloadDataAndRender() {
        await Promise.all([loadTerms(), loadEvents()]);
        // عدّل select السنة (قد تتغير بعد تغيير الفرع)
        const yearsData = state.years.map(y => ({ id: y.id, text: y.name }));
        $('#schoolYear').empty().select2({ theme: 'bootstrap-5', data: yearsData, width: '100%' })
            .val(state.yearId).trigger('change.select2');

        renderTermsTable(); renderCalendar();
    }

    async function init() {
        try {
            await loadBranches();
            await loadYears();

            // Bind filters بعد تحميل الداتا
            bindFilters();

            // Weekdays select2
            $('#termWeekdays').select2({ theme: 'bootstrap-5', width: '100%', placeholder: 'حدد أيام الدراسة' });

            // buttons
            $('#btnAddTerm').on('click', () => openTermModal());
            $('#btnAddEvent').on('click', () => openEventModal());
            $('#btnSaveTerm').on('click', saveTerm);
            $('#btnSaveEvent').on('click', saveEvent);
            $('#btnExport').on('click', () => Swal.fire('معلومة', 'تصدير JSON هنا محلي فقط، ويمكنك لاحقًا إرساله من API إذا رغبت', 'info'));

            // reactive fields
            $('#termName').on('change', function () { if (this.value === 'مخصص') $('#termNameCustomWrap').removeClass('d-none'); else $('#termNameCustomWrap').addClass('d-none'); });
            $('#termExamPeriod').on('change', function () { $('#examWrap').toggle(this.checked); });
            $('#termStart,#termEnd,#termWeekdays').on('change input', recalcTerm);

            await reloadDataAndRender();
        } catch (err) {
            console.error(err);
            Swal.fire('خطأ', 'تعذر تحميل البيانات من الخادم', 'error');
        }
    }

    $(init);
})();
