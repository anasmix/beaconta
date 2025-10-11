//// Api/Profiles/MappingProfile.cs
//using AutoMapper;
//using beaconta.Application.DTOs;
//using beaconta.Domain.Entities;

//namespace beaconta.Application.Mapping  
//{
//    public class MappingProfile : Profile
//    {
//        public MappingProfile()
//        {
//            CreateMap<GradeYearFee, GradeYearFeeDto>().ReverseMap();
//            CreateMap<GradeYear, GradeYearDto>().ReverseMap();

//            CreateMap<GradeYearUpsertDto, GradeYear>()
//                .ForMember(d => d.Id, o => o.Condition(s => s.Id != 0)); // لا تغيّر Id عند الإنشاء

//            CreateMap<SectionYear, SectionYearDto>().ReverseMap();
//            CreateMap<SectionYearUpsertDto, SectionYear>()
//                .ForMember(d => d.Id, o => o.Condition(s => s.Id != 0));
//        }
//    }
//}
using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Domain.Entities;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // الموجود لديك...
        CreateMap<GradeYear, GradeYearDto>().ForMember(d => d.Name, m => m.MapFrom(s => s.Name));
        CreateMap<GradeYearUpsertDto, GradeYear>();
        CreateMap<SectionYear, SectionYearDto>();
        CreateMap<SectionYearUpsertDto, SectionYear>();
        CreateMap<GradeYearFee, GradeYearFeeDto>().ReverseMap();

        // الإضافات للرسوم/المناهج
        CreateMap<Subject, SubjectDto>();
        CreateMap<FeeItemCatalog, FeeItemCatalogDto>();
        CreateMap<FeeBundleItem, FeeBundleItemDto>()
            .ForMember(d => d.ItemName, o => o.Ignore()); // سنملأها بالخدمة من الكتالوج
        CreateMap<FeeBundle, FeeBundleSummaryDto>()
            .ForMember(d => d.ItemsCount, o => o.MapFrom(s => s.Items.Count))
            .ForMember(d => d.Total, o => o.MapFrom(s => s.Items.Sum(i => i.Amount)));
        CreateMap<FeeBundle, FeeBundleDto>();
        CreateMap<CurriculumTemplate, CurriculumTemplateDto>();
        CreateMap<FeeLink, FeeLinkDto>();
        // MappingProfile.cs (أضف إلى ملفك الحالي)
        CreateMap<FeeItemCatalog, FeeItemCatalogDto>();

        CreateMap<FeeBundle, FeeBundleSummaryDto>()
            .ForMember(d => d.ItemsCount, m => m.MapFrom(s => s.Items.Count))
            .ForMember(d => d.Total, m => m.MapFrom(s => s.Items.Sum(i => i.Amount)));

        CreateMap<FeeBundleItem, FeeBundleItemDto>();

        CreateMap<FeeBundle, FeeBundleDto>()
            .ForMember(d => d.Items, m => m.MapFrom(s => s.Items));

    }
}
