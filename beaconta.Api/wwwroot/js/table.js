(function(){
  'use strict';
  const $ = jQuery;

  const AR_I18N = 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/ar.json';

  function latinizeFooter(){
    const toLatin = window.Utils?.toLatinDigits || ((s)=>s);
    const $info = $('.dataTables_info');
    $info.text(toLatin($info.text()));
    $('.dataTables_paginate').find('span, a').each(function(){ $(this).text(toLatin($(this).text())); });
  }

  function initDataTable($table, options){
    const dt = $table.DataTable(Object.assign({
      responsive: true,
      deferRender: true,
      language: { url: AR_I18N },
      dom: "<'row'<'col-sm-12'tr>>" + "<'d-flex justify-content-between align-items-center mt-2'<'small i><'small p>>",
      drawCallback: latinizeFooter
    }, options||{}));
    return dt;
  }

  window.Table = { initDataTable };
})();