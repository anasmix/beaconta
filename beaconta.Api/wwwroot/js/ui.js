(function(){
  'use strict';
  const $ = jQuery;

  function spinner(show){
    $('#progressBar').css('width', show? '65%':'0%');
    $('#progressText').text(show? 'جارٍ التحميل...' : 'جاهز');
  }

  function toast(icon, title){
    // SweetAlert2 toast
    return Swal.fire({toast:true, position:'top-start', icon, title, showConfirmButton:false, timer:2000, timerProgressBar:true});
  }

  function badge(status){
    const map = {Active:'ok', Draft:'warn', Inactive:'err'};
    const cls = map[status]||'warn';
    return `<span class="badge badge-status ${cls}">${status}</span>`;
  }

  // Select2 init (bootstrap theme)
  function initSelect2($el, opts){
    return $el.select2(Object.assign({
      theme: 'bootstrap-5',
      width: '100%',
      placeholder: 'اختر...',
      language: {
        noResults: ()=> 'لا توجد نتائج',
        searching: ()=> 'جارٍ البحث...'
      }
    }, opts||{}));
  }

  window.UI = { spinner, toast, badge, initSelect2 };
})();