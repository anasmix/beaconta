namespace beaconta.Application.DTOs
{
    public class SchoolDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string Status { get; set; } = "Active";
        public string? ColorHex { get; set; }
        public string? Notes { get; set; }

        // لعرضه في الجدول كما في الفرونت
        public int BranchesCount { get; set; }
    }

    public class SchoolUpsertDto
    {
        public int Id { get; set; } // 0 = new
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string Status { get; set; } = "Active";
        public string? ColorHex { get; set; }
        public string? Notes { get; set; }
    }
}
