// =========================
// MENU structure
// =========================
const MENU = {
  dashboard: {
    title: "الرئيسية",
    groups: [{
      title: "لوحة التحكم",
      items: [
        { id: "dashboard-overview", icon: "bi-speedometer2", title: "الرئيسية", desc: "نظرة عامة", url: "pages/dashboard.html" }
      ]
    }]
  },

  schoolYears: {
    title: "السنوات الدراسية",
    groups: [{
      title: "عمليات",
      items: [
        { id: "new-year", icon: "bi-calendar-plus", title: "إنشاء سنة جديدة", url: "pages/new-year.html" },
        { id: "terms-calendar", icon: "bi-calendar-week", title: "التقويم والفصول", url: "#" },
        { id: "rollover", icon: "bi-arrows-collapse", title: "ترحيل الطلاب", url: "#" }
      ]
    }]
  },

  students: {
    title: "الطلاب",
    groups: [{
      title: "إدارة الطلاب",
      items: [
        { id: "registration", icon: "bi-person-plus", title: "التسجيل والملفات", url: "#" },
        { id: "attendance", icon: "bi-calendar-check", title: "الحضور والغياب", url: "#" },
        { id: "behavior", icon: "bi-emoji-smile", title: "السلوك", url: "#" }
      ]
    }, {
      title: "الوثائق",
      items: [
        { id: "docs-checklist", icon: "bi-card-checklist", title: "قائمة الوثائق", url: "#" },
        { id: "docs-upload", icon: "bi-upload", title: "رفع المستندات", url: "#" }
      ]
    }]
  },

  finance: {
    title: "المالية",
    groups: [{
      title: "المعاملات",
      items: [
        { id: "installments-bills", icon: "bi-receipt", title: "الأقساط والفواتير", url: "#" },
        { id: "payment-vouchers", icon: "bi-cash-coin", title: "سندات القبض", url: "#" },
        { id: "budget-reports", icon: "bi-file-earmark-bar-graph", title: "التقارير المالية", url: "#" }
      ]
    }]
  },

  hr: {
    title: "شؤون الموظفين",
    groups: [{
      title: "الموظفون",
      items: [
        { id: "personal-files", icon: "bi-person-badge", title: "الملفات الشخصية", url: "#" },
        { id: "salaries", icon: "bi-cash-stack", title: "الرواتب", url: "#" },
        { id: "leaves", icon: "bi-arrow-up-right-circle", title: "الإجازات", url: "#" }
      ]
    }]
  },

  transport: {
    title: "المواصلات",
    groups: [{
      title: "إدارة النقل",
      items: [
        { id: "buses-drivers", icon: "bi-bus-front", title: "الباصات والسائقين", url: "#" },
        { id: "routes", icon: "bi-map", title: "المسارات", url: "#" },
        { id: "gps-tracking", icon: "bi-geo-alt", title: "تتبع GPS", url: "#" }
      ]
    }]
  }
};
