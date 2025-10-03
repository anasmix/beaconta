// js/screens/schools.js
$(function () {
  // إعداد آمن لمصدر API
  const ApiCfg = (window && window.API) ? window.API : { base: "/api" };

  // اختصارات API (fallback إلى jQuery)
  const apiGet    = window.api?.get    || (url => $.getJSON(url));
  const apiPost   = window.api?.post   || ((url,body)=> $.ajax({url,method:"POST",data:JSON.stringify(body),contentType:"application/json"}));
  const apiPut    = window.api?.put    || ((url,body)=> $.ajax({url,method:"PUT", data:JSON.stringify(body),contentType:"application/json"}));
  const apiDelete = window.api?.delete || (url => $.ajax({url,method:"DELETE"}));
  const makeDataTable = window.datatable?.make || ((tbl,opts)=> $(tbl).DataTable(opts));

  const ENDPOINTS = {
    list:    `${ApiCfg.base}/schools`,
    get:     (id) => `${ApiCfg.base}/schools/${id}`,
    upsert:  `${ApiCfg.base}/schools`,
    delete:  (id) => `${ApiCfg.base}/schools/${id}`
  };

  const $table = $("#schoolsTable");
  const $filterForm = $("#filterForm");
  const $modal = new bootstrap.Modal($("#schoolModal")[0]);

  let dt = null;

  function statusPill(status){
    const cls = (status === "Active") ? "success" : "secondary";
    const text = (status === "Active") ? "نشطة" : "غير نشطة";
    return `<span class="badge badge-status bg-${cls}">${text}</span>`;
  }

  function colorBadge(hex, label) {
    const fg = pickReadableText(hex);
    return `<span class="badge rounded-pill" style="background:${hex}; color:${fg}; border:1px solid #0002">${label || hex}</span>`;
  }

  function pickReadableText(hex = "#0d6efd") {
    try{
      const c = hex.replace("#","");
      const r = parseInt(c.substr(0,2),16);
      const g = parseInt(c.substr(2,2),16);
      const b = parseInt(c.substr(4,2),16);
      const yiq = ((r*299)+(g*587)+(b*114))/1000;
      return (yiq >= 150) ? "#111" : "#fff";
    }catch{ return "#fff"; }
  }

  function buildQuery(){
    const p = new URLSearchParams();
    const st = $("#filterStatus").val();
    const q  = $("#filterQuery").val()?.trim();
    if (st) p.set("status", st);
    if (q)  p.set("q", q);
    return p.toString() ? `?${p.toString()}` : "";
  }

  async function loadTable(){
    const url = ENDPOINTS.list + buildQuery();

    if (dt) { dt.ajax.url(url).load(); return; }

    dt = makeDataTable($table, {
      ajax: { url, dataSrc: "" },
      order: [[0,"asc"]],
      columns: [
        { data: "name", title: "المدرسة", render: (v,r,row)=> `<strong>${escapeHtml(v)}</strong>` },
        { data: "code", title: "الكود", defaultContent: "<span class='text-muted'>—</span>" },
        { data: "status", title: "الحالة", render: statusPill },
        { data: "colorHex", title: "اللون", render: (hex,row)=> hex ? colorBadge(hex, " ") : "<span class='text-muted'>—</span>" },
        { data: "branchesCount", title: "عدد الفروع", defaultContent: "0" },
        { data: null, title: "أوامر", orderable:false, searchable:false,
          render: (_,__,row)=>{
            const id=row.id;
            return `<div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary btn-edit" data-id="${id}" title="تعديل"><i class="bi bi-pencil-square"></i></button>
              <button class="btn btn-outline-danger btn-del" data-id="${id}" title="حذف"><i class="bi bi-trash"></i></button>
            </div>`;
          }
        }
      ],
      dom: "Bfrtip",
      buttons: [
        { extend: "excelHtml5", text: "تصدير Excel", title: "Schools" },
        { extend: "copyHtml5", text: "نسخ" }
      ]
    });

    $table.on("click",".btn-edit", onEdit);
    $table.on("click",".btn-del", onDelete);
  }

  // Toolbar
  $("#btnAdd").on("click", ()=> openUpsert());
  $("#btnExport").on("click", ()=> dt?.button(0).trigger());
  $("#btnRefresh").on("click", ()=> loadTable());
  $("#btnClearFilters").on("click", ()=> {
    $("#filterStatus").val("");
    $("#filterQuery").val("");
    $filterForm.trigger("submit");
  });
  $filterForm.on("submit", (e)=>{ e.preventDefault(); loadTable(); });

  async function openUpsert(id=null){
    $("#schoolModalTitle").text(id? "تعديل مدرسة":"مدرسة جديدة");
    resetForm("#schoolForm");
    if (id){
      const data = await apiGet(ENDPOINTS.get(id));
      setFormValues("#schoolForm",{ 
        id: data.id, name: data.name, code: data.code || "", 
        status: data.status || "Active", colorHex: data.colorHex || "#0d6efd", 
        notes: data.notes || "" 
      });
    } else {
      setFormValues("#schoolForm",{ status:"Active", colorHex:"#0d6efd" });
    }
    $modal.show();
  }

  $("#schoolForm").on("submit", async function(e){
    e.preventDefault();
    const dto = serializeForm("#schoolForm");
    if (!dto.name?.trim()){ toast.error("الاسم مطلوب."); return; }
    const isEdit = !!dto.id;
    const verb = isEdit ? apiPut : apiPost;
    const payload = {
      id: isEdit ? +dto.id : 0,
      name: dto.name.trim(),
      code: dto.code?.trim() || null,
      status: dto.status || "Active",
      colorHex: dto.colorHex || null,
      notes: dto.notes?.trim() || null
    };
    const saved = await verb(ENDPOINTS.upsert, payload);
    if (saved){
      toast.success("تم الحفظ بنجاح.");
      $modal.hide();
      loadTable();
    }
  });

  async function onEdit(){ openUpsert($(this).data("id")); }

  async function onDelete(){
    const id = $(this).data("id");
    const yes = await confirmDialog("هل تريد حذف هذه المدرسة؟");
    if (!yes) return;
    await apiDelete(ENDPOINTS.delete(id));
    toast.success("تم الحذف.");
    loadTable();
  }

  // Utils
  function escapeHtml(s){ return window.utils?.escapeHtml?.(s) ?? String(s ?? "").replace(/[&<>\"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }
  function toastProxy(type, msg){ (window.utils?.toast?.[type]||console.log)(msg); }
  const toast = { success: m=>toastProxy("success",m), error: m=>toastProxy("error",m) };
  function confirmDialog(message){
    if (window.utils?.confirmDialog) return window.utils.confirmDialog(message);
    return Promise.resolve(window.confirm(message));
  }
  function serializeForm(sel){
    return window.forms?.serializeForm?.(sel) || (function(){
      const o={}; $(sel).serializeArray().forEach(x => o[x.name]=o[x.name]?[].concat(o[x.name],x.value):x.value);
      $(sel).find("input[type=checkbox]").each(function(){ o[this.name]=this.checked; });
      return o;
    })();
  }
  function setFormValues(sel,obj){
    return window.forms?.setFormValues?.(sel,obj) || (function(){
      const $f=$(sel);
      Object.entries(obj||{}).forEach(([k,v])=>{
        const $el=$f.find(`[name='${k}']`);
        if ($el.is(":checkbox")) $el.prop("checked", !!v);
        else $el.val(v);
        if ($el.hasClass("select2")) $el.trigger("change");
      });
    })();
  }
  function resetForm(sel){ return window.forms?.resetForm?.(sel) || $(sel)[0].reset(); }

  // Init
  loadTable();
});