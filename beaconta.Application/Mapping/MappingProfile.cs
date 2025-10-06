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
        CreateMap<GradeYear, GradeYearDto>()
            .ForMember(d => d.Name, m => m.MapFrom(s => s.Name));

        CreateMap<GradeYearUpsertDto, GradeYear>();

        CreateMap<SectionYear, SectionYearDto>();
        CreateMap<SectionYearUpsertDto, SectionYear>();
        // رسوم الصف
        CreateMap<GradeYearFee, GradeYearFeeDto>().ReverseMap();
    }
}
