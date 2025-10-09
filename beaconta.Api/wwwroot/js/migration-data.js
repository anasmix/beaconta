// ===== Mock Data (no backend) =====
window.Mock = (function() {
  // Years
  const years = [
    { id: 2024, name: '2024/2025' },
    { id: 2025, name: '2025/2026' },
    { id: 2026, name: '2026/2027' }
  ];

  // Schools / Branches simplified
  const schools = [
    { id: 1, name: 'مدارس بيكونتا - المقر الرئيسي' },
    { id: 2, name: 'بيكونتا — فرع تلاع العلي' }
  ];

  // Stages/Grades/Sections minimal model
  const stages = [
    { id: 1, name: 'الابتدائية' },
    { id: 2, name: 'الإعدادية' },
    { id: 3, name: 'الثانوية' }
  ];

  const grades = [
    { id: 101, stageId: 1, order: 1, name: 'الأول' },
    { id: 102, stageId: 1, order: 2, name: 'الثاني' },
    { id: 103, stageId: 1, order: 3, name: 'الثالث' },
    { id: 201, stageId: 2, order: 1, name: 'السابع' },
    { id: 202, stageId: 2, order: 2, name: 'الثامن' },
    { id: 203, stageId: 2, order: 3, name: 'التاسع' },
    { id: 301, stageId: 3, order: 1, name: 'العاشر' },
    { id: 302, stageId: 3, order: 2, name: 'الحادي عشر' },
    { id: 303, stageId: 3, order: 3, name: 'الثاني عشر' }
  ];

  const sections = [
    { id: 1, gradeId: 101, name: 'أ' },
    { id: 2, gradeId: 101, name: 'ب' },
    { id: 3, gradeId: 102, name: 'أ' },
    { id: 4, gradeId: 103, name: 'أ' },
    { id: 5, gradeId: 201, name: 'أ' },
    { id: 6, gradeId: 202, name: 'أ' },
    { id: 7, gradeId: 203, name: 'أ' },
    { id: 8, gradeId: 301, name: 'أ' },
    { id: 9, gradeId: 302, name: 'علمي' },
    { id:10, gradeId: 302, name: 'أدبي' },
    { id:11, gradeId: 303, name: 'علمي' },
    { id:12, gradeId: 303, name: 'أدبي' }
  ];

  // Students minimal
  const students = [
    // grade 1
    { id: 1,  name: 'أحمد زيد', schoolId:1, gradeId:101, sectionId:1, avg: 78.3, fails: 0, hasContract: true, contractTotal: 1200, balance: -50, bus: 'B12' },
    { id: 2,  name: 'سندس فادي', schoolId:1, gradeId:101, sectionId:2, avg: 59.5, fails: 3, hasContract: true, contractTotal: 1200, balance: 120, bus: null },
    { id: 3,  name: 'محمد تيسير', schoolId:1, gradeId:101, sectionId:2, avg: 61.1, fails: 1, hasContract: false, contractTotal: 0,    balance: 0, bus: 'B09' },
    // grade 2
    { id: 4,  name: 'رنا رائد',   schoolId:1, gradeId:102, sectionId:3, avg: 85.2, fails: 0, hasContract: true, contractTotal: 1400, balance: 0,  bus: 'B03' },
    { id: 5,  name: 'هاشم عامر',  schoolId:1, gradeId:102, sectionId:3, avg: 48.7, fails: 4, hasContract: true, contractTotal: 1400, balance: 300, bus: null },
    // grade 3
    { id: 6,  name: 'ليان مازن',  schoolId:1, gradeId:103, sectionId:4, avg: 62.9, fails: 0, hasContract: true, contractTotal: 1400, balance: -20, bus: 'B01' },
    // grade 7
    { id: 7,  name: 'نور بيان',   schoolId:1, gradeId:201, sectionId:5, avg: 71.0, fails: 1, hasContract: true, contractTotal: 1600, balance: 0, bus: 'B08' },
    { id: 8,  name: 'يزن أيمن',   schoolId:1, gradeId:201, sectionId:5, avg: 52.3, fails: 2, hasContract: false, contractTotal: 0, balance: 0, bus: null },
    // grade 8
    { id: 9,  name: 'تالا صهيب',  schoolId:1, gradeId:202, sectionId:6, avg: 94.1, fails: 0, hasContract: true, contractTotal: 1700, balance: 0, bus: 'B04' },
    // grade 9
    { id: 10, name: 'وليد عارف',  schoolId:1, gradeId:203, sectionId:7, avg: 66.7, fails: 2, hasContract: true, contractTotal: 1750, balance: 50, bus: 'B02' },
    // grade 10
    { id: 11, name: 'رغد فارس',   schoolId:1, gradeId:301, sectionId:8, avg: 73.2, fails: 0, hasContract: true, contractTotal: 2000, balance: 0, bus: 'B10' },
    // grade 11 (two tracks)
    { id: 12, name: 'طارق عاصم',  schoolId:1, gradeId:302, sectionId:9, avg: 61.5, fails: 1, hasContract: true, contractTotal: 2100, balance: -100, bus: null },
    { id: 13, name: 'شهد ربيع',   schoolId:1, gradeId:302, sectionId:10, avg: 57.0, fails: 3, hasContract: true, contractTotal: 2100, balance: 200, bus: 'B07' },
    // grade 12 (graduates)
    { id: 14, name: 'ضياء ثائر',  schoolId:1, gradeId:303, sectionId:11, avg: 88.0, fails: 0, hasContract: true, contractTotal: 2300, balance: 0, bus: 'B01' },
    { id: 15, name: 'ميادة زهير', schoolId:1, gradeId:303, sectionId:12, avg: 62.0, fails: 0, hasContract: false, contractTotal: 0,    balance: 0, bus: null }
  ];

  // Section capacities for conflict simulation
  const capacities = [
    { sectionId: 9, capacity: 1 },  // intentionally low to cause conflicts in 11 Scientific
    { sectionId: 10, capacity: 30 },
    { sectionId: 11, capacity: 30 },
    { sectionId: 12, capacity: 30 }
  ];

  // helpers
  function nextGradeId(currentGradeId) {
    const g = grades.find(x => x.id === currentGradeId);
    if (!g) return null;
    const nextInStage = grades.find(x => x.stageId === g.stageId && x.order === g.order + 1);
    if (nextInStage) return nextInStage.id;
    // move to first grade of next stage (or graduate if last)
    const nextStage = stages.find(x => x.id === g.stageId + 1);
    if (!nextStage) return null; // graduate
    const first = grades.find(x => x.stageId === nextStage.id && x.order === 1);
    return first ? first.id : null;
  }

  return { years, schools, stages, grades, sections, students, capacities, nextGradeId };
})();