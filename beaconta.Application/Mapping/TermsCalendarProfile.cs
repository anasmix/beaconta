using AutoMapper;
using beaconta.Application.DTOs;
using beaconta.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace beaconta.Application.Mapping
{
    public class TermsCalendarProfile : Profile
    {
        public TermsCalendarProfile()
        {
            CreateMap<TermYear, TermYearDto>().ReverseMap();
            CreateMap<TermYearUpsertDto, TermYear>();

            CreateMap<CalendarEvent, CalendarEventDto>().ReverseMap();
            CreateMap<CalendarEventUpsertDto, CalendarEvent>();
        }
    }
}
