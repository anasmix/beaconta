// mock-data.js — بيانات وهمية قابلة للتوسعة
(function (w) {
  'use strict';

  const branches = [
    { id: 1, name: 'الفرع الرئيسي - البنين' },
    { id: 2, name: 'الفرع الرئيسي - البنات' }
  ];

  const years = [
    { id: 2024, name: '2024/2025' },
    { id: 2025, name: '2025/2026' }
  ];

  const stages = [
    { id: 1, name: 'المرحلة الأساسية' },
    { id: 2, name: 'المرحلة الثانوية' }
  ];

  const grades = [
    { id: 11, stageId: 1, name: 'الأول الأساسي' },
    { id: 12, stageId: 1, name: 'الثاني الأساسي' },
    { id: 21, stageId: 1, name: 'السابع' },
    { id: 22, stageId: 1, name: 'الثامن' },
    { id: 31, stageId: 2, name: 'الأول ثانوي' },
    { id: 32, stageId: 2, name: 'الثاني ثانوي' }
  ];

  const sections = [
    { id: 100, gradeId: 11, name: 'A' }, { id: 101, gradeId: 11, name: 'B' },
    { id: 110, gradeId: 12, name: 'A' },
    { id: 210, gradeId: 21, name: 'A' }, { id: 211, gradeId: 21, name: 'B' },
    { id: 220, gradeId: 22, name: 'A' },
    { id: 310, gradeId: 31, name: 'علمي' }, { id: 311, gradeId: 31, name: 'أدبي' },
    { id: 320, gradeId: 32, name: 'علمي' }, { id: 321, gradeId: 32, name: 'أدبي' }
  ];

  // مواد المنهاج (كتالوج)
  const subjectsCatalog = [
    { id: 1, code: 'AR', name: 'اللغة العربية', hours: 5, note: '' },
    { id: 2, code: 'EN', name: 'اللغة الإنجليزية', hours: 5, note: '' },
    { id: 3, code: 'MA', name: 'الرياضيات', hours: 5, note: '' },
    { id: 4, code: 'SC', name: 'العلوم', hours: 4, note: '' },
    { id: 5, code: 'IS', name: 'التربية الإسلامية', hours: 2, note: '' },
    { id: 6, code: 'IT', name: 'الحاسوب', hours: 2, note: '' },
    { id: 7, code: 'PE', name: 'التربية الرياضية', hours: 1, note: '' }
  ];

  // بنود الرسوم (كتالوج)
  const feeItemsCatalog = [
    { id: 'TUI', name: 'قسط دراسي' },
    { id: 'BUS', name: 'مواصلات' },
    { id: 'UNI', name: 'زي مدرسي' },
    { id: 'BK',  name: 'كتب' },
    { id: 'LAB', name: 'مختبر' },
    { id: 'ACT', name: 'أنشطة' }
  ];

  // قوالب/حزم رسوم جاهزة
  const feeBundles = [
    {
      id: 'BASIC',
      name: 'رسوم أساسية',
      items: [
        { itemId: 'TUI', amount: 650.00, repeat: 'term', optional: false, note: '' },
        { itemId: 'BK',  amount: 60.00,  repeat: 'once', optional: false, note: '' }
      ]
    },
    {
      id: 'FULL',
      name: 'رسوم كاملة',
      items: [
        { itemId: 'TUI', amount: 700.00, repeat: 'term', optional: false, note: '' },
        { itemId: 'BUS', amount: 200.00, repeat: 'monthly', optional: true, note: 'اختياري' },
        { itemId: 'BK',  amount: 60.00,  repeat: 'once', optional: false, note: '' },
        { itemId: 'ACT', amount: 25.00,  repeat: 'yearly', optional: true,  note: '' }
      ]
    }
  ];

  // قوالب مناهج
  const currTemplates = [
    { id: 'NAT25', name: 'المنهج الوطني 2025' },
    { id: 'ADV25', name: 'منهج متقدم 2025' }
  ];

  // روابط أولية (فارغة بالديمو)
  const existingLinks = [];

  // تخزين/تحميل من LocalStorage
  function loadState() {
    return {
      links: JSON.parse(localStorage.getItem('fees.links') || '[]'),
      bundles: JSON.parse(localStorage.getItem('fees.bundles') || 'null') || feeBundles,
      currs: JSON.parse(localStorage.getItem('fees.currs') || 'null') || currTemplates
    };
  }

  function saveState(state) {
    if (state.links)   localStorage.setItem('fees.links', JSON.stringify(state.links));
    if (state.bundles) localStorage.setItem('fees.bundles', JSON.stringify(state.bundles));
    if (state.currs)   localStorage.setItem('fees.currs', JSON.stringify(state.currs));
  }

  w.MockData = {
    branches, years, stages, grades, sections,
    subjectsCatalog, feeItemsCatalog,
    feeBundles,
    currTemplates,
    existingLinks,
    loadState, saveState
  };
})(window);
