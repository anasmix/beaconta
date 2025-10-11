(function(){
  'use strict';
  const KEY = 'beaconta-mock-dataset';
  if(localStorage.getItem(KEY)) return; // keep existing mock data

  // ----- Mock entities conforming to the project's spirit -----
  const schools = [{ id:1, name:'مدارس السباقون' }];
  const branches = [
    { id:7, schoolId:1, name:'فرع الذراع الغربي' },
    { id:8, schoolId:1, name:'فرع الجامعة' }
  ];
  const years = [
    { id:6, branchId:7, code:'2025/2026', name:'العام الدراسي 2025/2026' },
    { id:7, branchId:8, code:'2025/2026', name:'العام الدراسي 2025/2026' }
  ];
  const stages = [
    { id:9, schoolId:1, name:'المرحلة الأساسية' },
    { id:10, schoolId:1, name:'المرحلة الثانوية' }
  ];
  const gradeYears = [
    { id:101, stageId:9, name:'الأول الأساسي' },
    { id:102, stageId:9, name:'الثاني الأساسي' },
    { id:111, stageId:10, name:'الأول الثانوي' }
  ];
  const sectionYears = [
    { id:201, gradeYearId:101, name:'شعبة أ' },
    { id:202, gradeYearId:101, name:'شعبة ب' },
    { id:203, gradeYearId:102, name:'شعبة أ' }
  ];

  // Subjects
  const subjects = [
    { id:1, code:'AR', name:'اللغة العربية', note:'—' },
    { id:2, code:'EN', name:'اللغة الإنجليزية', note:'' },
    { id:3, code:'MA', name:'الرياضيات', note:'' },
    { id:4, code:'SC', name:'العلوم', note:'' },
    { id:5, code:'IS', name:'التربية الإسلامية', note:'' },
    { id:6, code:'IT', name:'الحاسوب', note:'اختياري' }
  ];

  // Curriculum Templates
  const curriculumTemplates = [
    { id:1, templateCode:'BAS-101', name:'منهج أساسي أول', yearId:6 },
    { id:2, templateCode:'BAS-102', name:'منهج أساسي ثاني', yearId:6 },
    { id:3, templateCode:'SEC-111', name:'منهج ثانوي أول', yearId:7 }
  ];

  // Template ↔ Subjects map
  const tplSubjects = {
    1:[1,2,3,4,5],
    2:[1,2,3,4,6],
    3:[1,2,3,6]
  };

  // Assignments GradeYear ↔ Template
  const assignments = [
    { id:1, gradeYearId:101, templateId:1 },
    { id:2, gradeYearId:102, templateId:2 }
  ];

  const dataset = { schools, branches, years, stages, gradeYears, sectionYears, subjects, curriculumTemplates, tplSubjects, assignments };
  localStorage.setItem(KEY, JSON.stringify(dataset));
})();
