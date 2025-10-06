// Api/DTOs/GradeYearCompareDto.cs
public class GradeYearCompareDto
{
    public int YearA { get; set; }
    public int YearB { get; set; }

    public int GradesCountA { get; set; }
    public int GradesCountB { get; set; }

    public int SectionsCountA { get; set; }
    public int SectionsCountB { get; set; }

    public int CapacitySumA { get; set; }
    public int CapacitySumB { get; set; }

    public decimal FeesSumA { get; set; }
    public decimal FeesSumB { get; set; }
}
