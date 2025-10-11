# Allowed Classes API Index

## Add_Branches_Table
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003001252_Add_Branches_Table.Designer.cs; Class=Add_Branches_Table; Properties=; Methods=}.File)

## Add_Branches_Table
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003001252_Add_Branches_Table.cs; Class=Add_Branches_Table; Properties=; Methods=}.File)

## Add_Stages_Grades
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003010330_Add_Stages_Grades.cs; Class=Add_Stages_Grades; Properties=; Methods=}.File)

## Add_Stages_Grades
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003010330_Add_Stages_Grades.Designer.cs; Class=Add_Stages_Grades; Properties=; Methods=}.File)

## Add_TermsAndCalendar
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251006214124_Add_TermsAndCalendar.cs; Class=Add_TermsAndCalendar; Properties=; Methods=}.File)

## Add_TermsAndCalendar
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251006214124_Add_TermsAndCalendar.Designer.cs; Class=Add_TermsAndCalendar; Properties=; Methods=}.File)

## Add_Years_Columns
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251004130337_Add_Years_Columns.Designer.cs; Class=Add_Years_Columns; Properties=; Methods=}.File)

## Add_Years_Columns
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251004130337_Add_Years_Columns.cs; Class=Add_Years_Columns; Properties=; Methods=}.File)

## Add_Years_Table
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003004854_Add_Years_Table.cs; Class=Add_Years_Table; Properties=; Methods=}.File)

## Add_Years_Table
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251003004854_Add_Years_Table.Designer.cs; Class=Add_Years_Table; Properties=; Methods=}.File)

## AddFeesAndCurricula
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251009223506_AddFeesAndCurricula.cs; Class=AddFeesAndCurricula; Properties=; Methods=}.File)

## AddFeesAndCurricula
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251009223506_AddFeesAndCurricula.Designer.cs; Class=AddFeesAndCurricula; Properties=; Methods=}.File)

## AddPermissionHierarchy
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250928214545_AddPermissionHierarchy.cs; Class=AddPermissionHierarchy; Properties=; Methods=}.File)

## AddPermissionHierarchy
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250928214545_AddPermissionHierarchy.Designer.cs; Class=AddPermissionHierarchy; Properties=; Methods=}.File)

## AddSchools
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251002191033_AddSchools.cs; Class=AddSchools; Properties=; Methods=}.File)

## AddSchools
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251002191033_AddSchools.Designer.cs; Class=AddSchools; Properties=; Methods=}.File)

## AddSectionYearStatus
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251006004756_AddSectionYearStatus.Designer.cs; Class=AddSectionYearStatus; Properties=; Methods=}.File)

## AddSectionYearStatus
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251006004756_AddSectionYearStatus.cs; Class=AddSectionYearStatus; Properties=; Methods=}.File)

## AuthController
- **Props:** Username, Password
- **Methods:** Login([FromBody] LoginRequestDto request); Me()
- Source: $(@{File=.\beaconta.Api\Controllers\AuthController.cs; Class=AuthController; Properties=Username, Password; Methods=Login([FromBody] LoginRequestDto request); Me()}.File)

## AuthService
- **Methods:** LoginAsync(string username, string password)
- Source: $(@{File=.\beaconta.Infrastructure\Services\AuthService.cs; Class=AuthService; Properties=; Methods=LoginAsync(string username, string password)}.File)

## BeacontaDb
- **Props:** Permissions, Schools
- Source: $(@{File=.\beaconta.Infrastructure\Data\BeacontaDb.cs; Class=BeacontaDb; Properties=Permissions, Schools; Methods=}.File)

## BeacontaDbModelSnapshot
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\BeacontaDbModelSnapshot.cs; Class=BeacontaDbModelSnapshot; Properties=; Methods=}.File)

## Branch
- **Props:** Id, SchoolId, Name, Code, Status, ColorHex, Address, City, District, Latitude, Longitude, Phone, ManagerName, Capacity, CurrentStudents, Notes, CreatedAt, UpdatedAt, School
- Source: $(@{File=.\beaconta.Domain\Entities\Branch.cs; Class=Branch; Properties=Id, SchoolId, Name, Code, Status, ColorHex, Address, City, District, Latitude, Longitude, Phone, ManagerName, Capacity, CurrentStudents, Notes, CreatedAt, UpdatedAt, School; Methods=}.File)

## BranchDto
- **Props:** Id, SchoolId, SchoolName, Name, Code, Status, City, District, Phone, ManagerName, Capacity, CurrentStudents, Latitude, Longitude, Notes
- Source: $(@{File=.\beaconta.Application\DTOs\BranchDto.cs; Class=BranchDto; Properties=Id, SchoolId, SchoolName, Name, Code, Status, City, District, Phone, ManagerName, Capacity, CurrentStudents, Latitude, Longitude, Notes; Methods=}.File)

## BranchesController
- **Methods:** GetAll([FromQuery] int? schoolId,
        [FromQuery] string? status,
        [FromQuery] string? city,
        [FromQuery] int? capMin,
        [FromQuery] int? capMax,
        CancellationToken ct); GetById(int id, CancellationToken ct); GetStats([FromQuery] int? schoolId, CancellationToken ct); Create([FromBody] BranchUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] BranchUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\BranchesController.cs; Class=BranchesController; Properties=; Methods=GetAll([FromQuery] int? schoolId,
        [FromQuery] string? status,
        [FromQuery] string? city,
        [FromQuery] int? capMin,
        [FromQuery] int? capMax,
        CancellationToken ct); GetById(int id, CancellationToken ct); GetStats([FromQuery] int? schoolId, CancellationToken ct); Create([FromBody] BranchUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] BranchUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)}.File)

## BranchService
- **Methods:** GetAllAsync(CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(BranchUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\BranchService.cs; Class=BranchService; Properties=; Methods=GetAllAsync(CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(BranchUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct)}.File)

## BranchUpsertDto
- **Props:** Id, SchoolId, Name, Code, Status, City, District, Phone, ManagerName, Capacity, CurrentStudents, Latitude, Longitude, Notes
- Source: $(@{File=.\beaconta.Application\DTOs\BranchUpsertDto.cs; Class=BranchUpsertDto; Properties=Id, SchoolId, Name, Code, Status, City, District, Phone, ManagerName, Capacity, CurrentStudents, Latitude, Longitude, Notes; Methods=}.File)

## BulkDto
- **Methods:** ByGrade(int gradeYearId, CancellationToken ct); Create([FromBody] SectionYearUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); Bulk([FromBody] BulkDto dto, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\SectionYearsController.cs; Class=BulkDto; Properties=; Methods=ByGrade(int gradeYearId, CancellationToken ct); Create([FromBody] SectionYearUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); Bulk([FromBody] BulkDto dto, CancellationToken ct)}.File)

## CalendarEvent
- **Props:** Id, YearId, Year, Type, Title, StartDate, EndDate, Notes, CreatedAt, UpdatedAt
- Source: $(@{File=.\beaconta.Domain\Entities\CalendarEvent.cs; Class=CalendarEvent; Properties=Id, YearId, Year, Type, Title, StartDate, EndDate, Notes, CreatedAt, UpdatedAt; Methods=}.File)

## CalendarEventsController
- **Methods:** List([FromQuery] int yearId, CancellationToken ct); Create([FromBody] CalendarEventUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] CalendarEventUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\CalendarEventsController.cs; Class=CalendarEventsController; Properties=; Methods=List([FromQuery] int yearId, CancellationToken ct); Create([FromBody] CalendarEventUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] CalendarEventUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)}.File)

## CalendarEventService
- **Methods:** GetByYearAsync(int yearId, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(CalendarEventUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\CalendarEventService.cs; Class=CalendarEventService; Properties=; Methods=GetByYearAsync(int yearId, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(CalendarEventUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct)}.File)

## CalendarEventUpsertValidator
- Source: $(@{File=.\beaconta.Api\Validators\TermsCalendarValidators.cs; Class=CalendarEventUpsertValidator; Properties=; Methods=}.File)

## Class1
- Source: $(@{File=.\beaconta.Application\Class1.cs; Class=Class1; Properties=; Methods=}.File)

## Class1
- Source: $(@{File=.\beaconta.Domain\Class1.cs; Class=Class1; Properties=; Methods=}.File)

## Class1
- Source: $(@{File=.\beaconta.Infrastructure\Class1.cs; Class=Class1; Properties=; Methods=}.File)

## CleanRolePermissions
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927214048_CleanRolePermissions.cs; Class=CleanRolePermissions; Properties=; Methods=}.File)

## CleanRolePermissions
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927214048_CleanRolePermissions.Designer.cs; Class=CleanRolePermissions; Properties=; Methods=}.File)

## CloneRoleDto
- **Props:** FromRoleId
- **Methods:** GetAll(); GetById(int id); Create([FromBody] CreateRoleDto dto); UpdateName(int id, [FromBody] UpdateRoleDto dto); Delete(int id); UpdatePermissions(int id, [FromBody] UpdateRolePermissionsDto dto); GetUsers(int id); ClonePermissions(int id, [FromBody] CloneRoleDto dto)
- Source: $(@{File=.\beaconta.Api\Controllers\RolesController.cs; Class=CloneRoleDto; Properties=FromRoleId; Methods=GetAll(); GetById(int id); Create([FromBody] CreateRoleDto dto); UpdateName(int id, [FromBody] UpdateRoleDto dto); Delete(int id); UpdatePermissions(int id, [FromBody] UpdateRolePermissionsDto dto); GetUsers(int id); ClonePermissions(int id, [FromBody] CloneRoleDto dto)}.File)

## CompareResponseDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=CompareResponseDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## CreateRoleDto
- **Props:** Name
- Source: $(@{File=.\beaconta.Application\DTOs\CreateRoleDto.cs; Class=CreateRoleDto; Properties=Name; Methods=}.File)

## CurrentUserService
- Source: $(@{File=.\beaconta.Infrastructure\Services\CurrentUserService.cs; Class=CurrentUserService; Properties=; Methods=}.File)

## CurriculaController
- **Methods:** Templates([FromQuery] int? yearId, CancellationToken ct); Create([FromBody] CurriculumTemplateDto dto, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\CurriculaController.cs; Class=CurriculaController; Properties=; Methods=Templates([FromQuery] int? yearId, CancellationToken ct); Create([FromBody] CurriculumTemplateDto dto, CancellationToken ct)}.File)

## CurriculumTemplate
- **Props:** Id, TemplateCode, Name, YearId, Year
- Source: $(@{File=.\beaconta.Domain\Entities\CurriculumTemplate.cs; Class=CurriculumTemplate; Properties=Id, TemplateCode, Name, YearId, Year; Methods=}.File)

## CurriculumTemplateConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=CurriculumTemplateConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## FeeBundle
- **Props:** Id, BundleCode, Name, Desc, Items, Id, FeeBundleId, Bundle, ItemCode, Amount, Repeat, Optional, Note
- Source: $(@{File=.\beaconta.Domain\Entities\FeeBundle.cs; Class=FeeBundle; Properties=Id, BundleCode, Name, Desc, Items, Id, FeeBundleId, Bundle, ItemCode, Amount, Repeat, Optional, Note; Methods=}.File)

## FeeBundleConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=FeeBundleConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## FeeBundleItem
- **Props:** Id, BundleCode, Name, Desc, Items, Id, FeeBundleId, Bundle, ItemCode, Amount, Repeat, Optional, Note
- Source: $(@{File=.\beaconta.Domain\Entities\FeeBundle.cs; Class=FeeBundleItem; Properties=Id, BundleCode, Name, Desc, Items, Id, FeeBundleId, Bundle, ItemCode, Amount, Repeat, Optional, Note; Methods=}.File)

## FeeBundleItemConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=FeeBundleItemConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## FeeItemCatalog
- **Props:** Id, ItemCode, Name
- Source: $(@{File=.\beaconta.Domain\Entities\FeeItemCatalog.cs; Class=FeeItemCatalog; Properties=Id, ItemCode, Name; Methods=}.File)

## FeeItemCatalogConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=FeeItemCatalogConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## FeeLink
- **Props:** Id, GradeYearId, SectionYearId, SubjectId, FeeBundleId, EffectiveFrom, Status, SchoolName, YearName, StageName, GradeYearName, SectionName, SubjectName, BundleName
- Source: $(@{File=.\beaconta.Domain\Entities\FeeLink.cs; Class=FeeLink; Properties=Id, GradeYearId, SectionYearId, SubjectId, FeeBundleId, EffectiveFrom, Status, SchoolName, YearName, StageName, GradeYearName, SectionName, SubjectName, BundleName; Methods=}.File)

## FeeLinkConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=FeeLinkConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## FeesController
- **Methods:** Items(CancellationToken ct); Bundles([FromQuery] int? gradeYearId, CancellationToken ct); Bundle([FromRoute] int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\FeesController.cs; Class=FeesController; Properties=; Methods=Items(CancellationToken ct); Bundles([FromQuery] int? gradeYearId, CancellationToken ct); Bundle([FromRoute] int id, CancellationToken ct)}.File)

## FeesLinksController
- **Methods:** Get([FromQuery] int schoolId, [FromQuery] int yearId, [FromQuery] int? stageId, [FromQuery] int? gradeYearId, [FromQuery] int? sectionYearId, CancellationToken ct); CreateBulk([FromBody] CreateLinksBulkRequest req, CancellationToken ct); Update([FromRoute] int id, [FromBody] UpdateFeeLinkRequest req, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\FeesLinksController.cs; Class=FeesLinksController; Properties=; Methods=Get([FromQuery] int schoolId, [FromQuery] int yearId, [FromQuery] int? stageId, [FromQuery] int? gradeYearId, [FromQuery] int? sectionYearId, CancellationToken ct); CreateBulk([FromBody] CreateLinksBulkRequest req, CancellationToken ct); Update([FromRoute] int id, [FromBody] UpdateFeeLinkRequest req, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct)}.File)

## FeesLinksService
- **Methods:** GetLinksAsync(int schoolId, int yearId, int? stageId, int? gradeYearId, int? sectionYearId, CancellationToken ct = default); CreateLinksBulkAsync(CreateLinksBulkRequest req, CancellationToken ct = default); UpdateLinkAsync(int id, UpdateFeeLinkRequest req, CancellationToken ct = default); DeleteLinkAsync(int id, CancellationToken ct = default)
- Source: $(@{File=.\beaconta.Infrastructure\Services\FeesLinksService.cs; Class=FeesLinksService; Properties=; Methods=GetLinksAsync(int schoolId, int yearId, int? stageId, int? gradeYearId, int? sectionYearId, CancellationToken ct = default); CreateLinksBulkAsync(CreateLinksBulkRequest req, CancellationToken ct = default); UpdateLinkAsync(int id, UpdateFeeLinkRequest req, CancellationToken ct = default); DeleteLinkAsync(int id, CancellationToken ct = default)}.File)

## FeesService
- **Methods:** GetFeeItemsAsync(CancellationToken ct = default); GetBundlesAsync(int? gradeYearId, CancellationToken ct = default); GetBundleAsync(int id, CancellationToken ct = default)
- Source: $(@{File=.\beaconta.Infrastructure\Services\FeesService.cs; Class=FeesService; Properties=; Methods=GetFeeItemsAsync(CancellationToken ct = default); GetBundlesAsync(int? gradeYearId, CancellationToken ct = default); GetBundleAsync(int id, CancellationToken ct = default)}.File)

## FixRolePermissionCompositeKey
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925201556_FixRolePermissionCompositeKey.Designer.cs; Class=FixRolePermissionCompositeKey; Properties=; Methods=}.File)

## FixRolePermissionCompositeKey
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925201556_FixRolePermissionCompositeKey.cs; Class=FixRolePermissionCompositeKey; Properties=; Methods=}.File)

## FixSeedStaticValues
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927173501_FixSeedStaticValues.cs; Class=FixSeedStaticValues; Properties=; Methods=}.File)

## FixSeedStaticValues
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927173501_FixSeedStaticValues.Designer.cs; Class=FixSeedStaticValues; Properties=; Methods=}.File)

## FixUserRolesWithId
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925202302_FixUserRolesWithId.cs; Class=FixUserRolesWithId; Properties=; Methods=}.File)

## FixUserRolesWithId
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925202302_FixUserRolesWithId.Designer.cs; Class=FixUserRolesWithId; Properties=; Methods=}.File)

## Grade
- **Props:** Id, SchoolId, BranchId, StageId, GradeName, SectionName, Code, Shift, YearId, Status, Capacity, HomeroomTeacherId, SupervisorId, Notes
- Source: $(@{File=.\beaconta.Domain\Entities\Grade.cs; Class=Grade; Properties=Id, SchoolId, BranchId, StageId, GradeName, SectionName, Code, Shift, YearId, Status, Capacity, HomeroomTeacherId, SupervisorId, Notes; Methods=}.File)

## GradesController
- **Methods:** GradeRowDto(int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, int available, decimal feesTotal,
            int sectionsCount, string status,
              List<string> sectionsPreview // 👈 جديد); FeeItemDto(string type, string? name, decimal amount); GradeDetailDto(int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeItemDto> fees); SaveReq(int yearId, int schoolId, int stageId,
            string name, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeReq>? fees); FeeReq(string type, string? name, decimal amount); List([FromQuery] int? schoolId,
            [FromQuery] int? stageId,
            [FromQuery] int? yearId,
            [FromQuery] string? status,
            [FromQuery] string? shift,
            [FromQuery] string? gender,
            [FromQuery] string? q,
            CancellationToken ct = default); GetById([FromRoute] int id, CancellationToken ct = default); LockGrade([FromRoute] int id, CancellationToken ct); UnlockGrade([FromRoute] int id, CancellationToken ct); Create([FromBody] SaveReq req, CancellationToken ct); Update([FromRoute] int id, [FromBody] SaveReq req, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\GradesController.cs; Class=GradesController; Properties=; Methods=GradeRowDto(int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, int available, decimal feesTotal,
            int sectionsCount, string status,
              List<string> sectionsPreview // 👈 جديد); FeeItemDto(string type, string? name, decimal amount); GradeDetailDto(int id, int schoolId, int stageId, int yearId,
            string gradeName, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeItemDto> fees); SaveReq(int yearId, int schoolId, int stageId,
            string name, string shift, string gender,
            int capacity, decimal tuition, int sortOrder,
            string status, string? notes, List<FeeReq>? fees); FeeReq(string type, string? name, decimal amount); List([FromQuery] int? schoolId,
            [FromQuery] int? stageId,
            [FromQuery] int? yearId,
            [FromQuery] string? status,
            [FromQuery] string? shift,
            [FromQuery] string? gender,
            [FromQuery] string? q,
            CancellationToken ct = default); GetById([FromRoute] int id, CancellationToken ct = default); LockGrade([FromRoute] int id, CancellationToken ct); UnlockGrade([FromRoute] int id, CancellationToken ct); Create([FromBody] SaveReq req, CancellationToken ct); Update([FromRoute] int id, [FromBody] SaveReq req, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct)}.File)

## GradeSectionsController
- **Methods:** List([FromRoute] int gradeYearId, CancellationToken ct = default); GetById([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); Create([FromRoute] int gradeYearId, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default); Update([FromRoute] int gradeYearId, [FromRoute] int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default); Delete([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); BulkCreate([FromRoute] int gradeYearId, [FromBody] List<SectionYearUpsertDto> dtos, CancellationToken ct = default); Lock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); Unlock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)
- Source: $(@{File=.\beaconta.Api\Controllers\GradeSectionsController.cs; Class=GradeSectionsController; Properties=; Methods=List([FromRoute] int gradeYearId, CancellationToken ct = default); GetById([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); Create([FromRoute] int gradeYearId, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default); Update([FromRoute] int gradeYearId, [FromRoute] int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct = default); Delete([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); BulkCreate([FromRoute] int gradeYearId, [FromBody] List<SectionYearUpsertDto> dtos, CancellationToken ct = default); Lock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default); Unlock([FromRoute] int gradeYearId, [FromRoute] int id, CancellationToken ct = default)}.File)

## GradeYear
- **Props:** Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt
- Source: $(@{File=.\beaconta.Domain\Entities\GradeYear.cs; Class=GradeYear; Properties=Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt; Methods=}.File)

## GradeYearCompareDto
- **Props:** YearA, YearB, GradesCountA, GradesCountB, SectionsCountA, SectionsCountB, CapacitySumA, CapacitySumB, FeesSumA, FeesSumB
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearCompareDto.cs; Class=GradeYearCompareDto; Properties=YearA, YearB, GradesCountA, GradesCountB, SectionsCountA, SectionsCountB, CapacitySumA, CapacitySumB, FeesSumA, FeesSumB; Methods=}.File)

## GradeYearConfiguration
- **Methods:** Configure(EntityTypeBuilder<GradeYear> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\GradeYearConfiguration.cs; Class=GradeYearConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<GradeYear> b)}.File)

## GradeYearDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=GradeYearDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## GradeYearFee
- **Props:** Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt
- Source: $(@{File=.\beaconta.Domain\Entities\GradeYear.cs; Class=GradeYearFee; Properties=Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt; Methods=}.File)

## GradeYearFeeDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=GradeYearFeeDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## GradeYearsController
- **Methods:** GetAll([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, CancellationToken ct); GetById(int id, CancellationToken ct); Create([FromBody] GradeYearUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] GradeYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); ToggleStatus(int id, CancellationToken ct); Export([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, [FromQuery] string format, CancellationToken ct); Compare([FromQuery] int yearA, [FromQuery] int yearB, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\GradeYearsController.cs; Class=GradeYearsController; Properties=; Methods=GetAll([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, CancellationToken ct); GetById(int id, CancellationToken ct); Create([FromBody] GradeYearUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] GradeYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); ToggleStatus(int id, CancellationToken ct); Export([FromQuery] int yearId, [FromQuery] int? schoolId, [FromQuery] int? stageId, [FromQuery] string? q, [FromQuery] string format, CancellationToken ct); Compare([FromQuery] int yearA, [FromQuery] int yearB, CancellationToken ct)}.File)

## GradeYearService
- **Methods:** GetAllAsync(int yearId, int? schoolId, int? stageId, string? q, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(GradeYearUpsertDto dto, string? userName, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); ToggleStatusAsync(int id, CancellationToken ct); ExportAsync(int yearId, int? schoolId, int? stageId, string? q, string? format, CancellationToken ct); CompareAsync(int yearA, int yearB, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\GradeYearService.cs; Class=GradeYearService; Properties=; Methods=GetAllAsync(int yearId, int? schoolId, int? stageId, string? q, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(GradeYearUpsertDto dto, string? userName, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); ToggleStatusAsync(int id, CancellationToken ct); ExportAsync(int yearId, int? schoolId, int? stageId, string? q, string? format, CancellationToken ct); CompareAsync(int yearA, int yearB, CancellationToken ct)}.File)

## GradeYearUpsertDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=GradeYearUpsertDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## GradeYearUpsertValidator
- Source: $(@{File=.\beaconta.Api\Validators\GradeYearUpsertValidator.cs; Class=GradeYearUpsertValidator; Properties=; Methods=}.File)

## HealthController
- **Methods:** Get()
- Source: $(@{File=.\beaconta.Api\Controllers\HealthController.cs; Class=HealthController; Properties=; Methods=Get()}.File)

## Init_Grades
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251004034013_Init_Grades.cs; Class=Init_Grades; Properties=; Methods=}.File)

## Init_Grades
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251004034013_Init_Grades.Designer.cs; Class=Init_Grades; Properties=; Methods=}.File)

## InitFullDb
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925193812_InitFullDb.Designer.cs; Class=InitFullDb; Properties=; Methods=}.File)

## InitFullDb
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250925193812_InitFullDb.cs; Class=InitFullDb; Properties=; Methods=}.File)

## LoginRequest
- **Props:** Username, Password
- **Methods:** Login([FromBody] LoginRequestDto request); Me()
- Source: $(@{File=.\beaconta.Api\Controllers\AuthController.cs; Class=LoginRequest; Properties=Username, Password; Methods=Login([FromBody] LoginRequestDto request); Me()}.File)

## LoginRequestDto
- **Props:** Username, Password, Token, ExpiresAtUtc
- Source: $(@{File=.\beaconta.Application\DTOs\AuthDtos.cs; Class=LoginRequestDto; Properties=Username, Password, Token, ExpiresAtUtc; Methods=}.File)

## LoginResponseDto
- **Props:** Username, Password, Token, ExpiresAtUtc
- Source: $(@{File=.\beaconta.Application\DTOs\AuthDtos.cs; Class=LoginResponseDto; Properties=Username, Password, Token, ExpiresAtUtc; Methods=}.File)

## MappingProfile
- Source: $(@{File=.\beaconta.Application\Mapping\MappingProfile.cs; Class=MappingProfile; Properties=; Methods=}.File)

## MeController
- **Methods:** GetPermissions(CancellationToken ct = default)
- Source: $(@{File=.\beaconta.Api\Controllers\MeController.cs; Class=MeController; Properties=; Methods=GetPermissions(CancellationToken ct = default)}.File)

## MenuAction
- **Props:** MenuItemId, MenuItem, ActionKey, Title, SortOrder
- Source: $(@{File=.\beaconta.Domain\Entities\MenuAction.cs; Class=MenuAction; Properties=MenuItemId, MenuItem, ActionKey, Title, SortOrder; Methods=}.File)

## MenuController
- **Methods:** GetMyMenu(CancellationToken ct); GetCatalog(CancellationToken ct); Invalidate(int userId)
- Source: $(@{File=.\beaconta.Api\Controllers\MenuController.cs; Class=MenuController; Properties=; Methods=GetMyMenu(CancellationToken ct); GetCatalog(CancellationToken ct); Invalidate(int userId)}.File)

## MenuGroup
- **Props:** SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission
- Source: $(@{File=.\beaconta.Domain\Entities\Menu.cs; Class=MenuGroup; Properties=SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission; Methods=}.File)

## MenuGroupConfiguration
- **Methods:** Configure(EntityTypeBuilder<MenuGroup> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\MenuGroupConfiguration.cs; Class=MenuGroupConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<MenuGroup> b)}.File)

## MenuItem
- **Props:** SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission
- Source: $(@{File=.\beaconta.Domain\Entities\Menu.cs; Class=MenuItem; Properties=SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission; Methods=}.File)

## MenuItemConfiguration
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\MenuItemConfiguration.cs; Class=MenuItemConfiguration; Properties=; Methods=}.File)

## MenuItemPermission
- **Props:** SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission
- Source: $(@{File=.\beaconta.Domain\Entities\Menu.cs; Class=MenuItemPermission; Properties=SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission; Methods=}.File)

## MenuItemPermissionConfiguration
- **Methods:** Configure(EntityTypeBuilder<MenuItemPermission> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\MenuItemPermissionConfiguration.cs; Class=MenuItemPermissionConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<MenuItemPermission> b)}.File)

## MenuRepository
- **Methods:** LoadFullMenuAsync(CancellationToken ct); GetPermissionKeysForUserAsync(int userId, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\MenuRepository.cs; Class=MenuRepository; Properties=; Methods=LoadFullMenuAsync(CancellationToken ct); GetPermissionKeysForUserAsync(int userId, CancellationToken ct)}.File)

## MenuSection
- **Props:** SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission
- Source: $(@{File=.\beaconta.Domain\Entities\Menu.cs; Class=MenuSection; Properties=SectionKey, Title, Icon, SortOrder, Groups, SectionId, Section, Title, SortOrder, Items, GroupId, Group, ItemKey, Title, Icon, Url, SortOrder, MatchMode, MenuItemPermissions, MenuItemId, MenuItem, PermissionId, Permission; Methods=}.File)

## MenuSectionConfiguration
- **Methods:** Configure(EntityTypeBuilder<MenuSection> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\MenuSectionConfiguration.cs; Class=MenuSectionConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<MenuSection> b)}.File)

## MenuService
- **Methods:** GetMenuForCurrentUserAsync(CancellationToken ct = default); GetMenuCatalogAsync(CancellationToken ct = default); InvalidateCacheForUserAsync(int userId)
- Source: $(@{File=.\beaconta.Infrastructure\Services\MenuService.cs; Class=MenuService; Properties=; Methods=GetMenuForCurrentUserAsync(CancellationToken ct = default); GetMenuCatalogAsync(CancellationToken ct = default); InvalidateCacheForUserAsync(int userId)}.File)

## Permission
- **Props:** Key, Name, Category, ParentId, Parent, Children, RolePermissions
- Source: $(@{File=.\beaconta.Domain\Entities\Permission.cs; Class=Permission; Properties=Key, Name, Category, ParentId, Parent, Children, RolePermissions; Methods=}.File)

## PermissionDto
- **Props:** Id, Key, Name, Category
- Source: $(@{File=.\beaconta.Application\DTOs\PermissionDto.cs; Class=PermissionDto; Properties=Id, Key, Name, Category; Methods=}.File)

## PermissionsController
- **Methods:** GetGrouped(); GetAll(); GetByCategory(string category)
- Source: $(@{File=.\beaconta.Api\Controllers\PermissionsController.cs; Class=PermissionsController; Properties=; Methods=GetGrouped(); GetAll(); GetByCategory(string category)}.File)

## PermissionService
- **Methods:** GetAllAsync(); GetByCategoryAsync(string category)
- Source: $(@{File=.\beaconta.Infrastructure\Services\PermissionService.cs; Class=PermissionService; Properties=; Methods=GetAllAsync(); GetByCategoryAsync(string category)}.File)

## Refactor_RolePermissions_To_Permissions
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927195649_Refactor_RolePermissions_To_Permissions.Designer.cs; Class=Refactor_RolePermissions_To_Permissions; Properties=; Methods=}.File)

## Refactor_RolePermissions_To_Permissions
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927195649_Refactor_RolePermissions_To_Permissions.cs; Class=Refactor_RolePermissions_To_Permissions; Properties=; Methods=}.File)

## RemoveMenuItemIdFromRolePermission
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927172051_RemoveMenuItemIdFromRolePermission.Designer.cs; Class=RemoveMenuItemIdFromRolePermission; Properties=; Methods=}.File)

## RemoveMenuItemIdFromRolePermission
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927172051_RemoveMenuItemIdFromRolePermission.cs; Class=RemoveMenuItemIdFromRolePermission; Properties=; Methods=}.File)

## Role
- **Props:** Name, Key, UserRoles, RolePermissions
- Source: $(@{File=.\beaconta.Domain\Entities\Role.cs; Class=Role; Properties=Name, Key, UserRoles, RolePermissions; Methods=}.File)

## RoleDto
- **Props:** Id, Key, Name, UsersCount, PermissionIds, CreatedAt
- Source: $(@{File=.\beaconta.Application\DTOs\RoleDto.cs; Class=RoleDto; Properties=Id, Key, Name, UsersCount, PermissionIds, CreatedAt; Methods=}.File)

## RoleListItemDto
- **Props:** Id, Name, UsersCount, PermissionsCount, CreatedAt, Id, Username, FullName, Email, Phone, Status, LastLogin
- Source: $(@{File=.\beaconta.Application\DTOs\RoleListItemDto.cs; Class=RoleListItemDto; Properties=Id, Name, UsersCount, PermissionsCount, CreatedAt, Id, Username, FullName, Email, Phone, Status, LastLogin; Methods=}.File)

## RolePermission
- **Props:** RoleId, PermissionId, Role, Permission
- Source: $(@{File=.\beaconta.Domain\Entities\RolePermission.cs; Class=RolePermission; Properties=RoleId, PermissionId, Role, Permission; Methods=}.File)

## RolesController
- **Props:** FromRoleId
- **Methods:** GetAll(); GetById(int id); Create([FromBody] CreateRoleDto dto); UpdateName(int id, [FromBody] UpdateRoleDto dto); Delete(int id); UpdatePermissions(int id, [FromBody] UpdateRolePermissionsDto dto); GetUsers(int id); ClonePermissions(int id, [FromBody] CloneRoleDto dto)
- Source: $(@{File=.\beaconta.Api\Controllers\RolesController.cs; Class=RolesController; Properties=FromRoleId; Methods=GetAll(); GetById(int id); Create([FromBody] CreateRoleDto dto); UpdateName(int id, [FromBody] UpdateRoleDto dto); Delete(int id); UpdatePermissions(int id, [FromBody] UpdateRolePermissionsDto dto); GetUsers(int id); ClonePermissions(int id, [FromBody] CloneRoleDto dto)}.File)

## RoleService
- **Methods:** GetAllAsync(); GetByIdAsync(int id); CreateAsync(string name); UpdateNameAsync(int id, string newName); DeleteAsync(int id); UpdatePermissionsAsync(UpdateRolePermissionsDto dto); ClonePermissionsAsync(int fromRoleId, int toRoleId); GetUsersByRoleIdAsync(int roleId)
- Source: $(@{File=.\beaconta.Infrastructure\Services\RoleService.cs; Class=RoleService; Properties=; Methods=GetAllAsync(); GetByIdAsync(int id); CreateAsync(string name); UpdateNameAsync(int id, string newName); DeleteAsync(int id); UpdatePermissionsAsync(UpdateRolePermissionsDto dto); ClonePermissionsAsync(int fromRoleId, int toRoleId); GetUsersByRoleIdAsync(int roleId)}.File)

## RoleUserDto
- **Props:** Id, Name, UsersCount, PermissionsCount, CreatedAt, Id, Username, FullName, Email, Phone, Status, LastLogin
- Source: $(@{File=.\beaconta.Application\DTOs\RoleListItemDto.cs; Class=RoleUserDto; Properties=Id, Name, UsersCount, PermissionsCount, CreatedAt, Id, Username, FullName, Email, Phone, Status, LastLogin; Methods=}.File)

## School
- **Props:** Name, Code, Status, ColorHex, Notes, Branches
- Source: $(@{File=.\beaconta.Domain\Entities\School.cs; Class=School; Properties=Name, Code, Status, ColorHex, Notes, Branches; Methods=}.File)

## SchoolConfig
- **Methods:** Configure(EntityTypeBuilder<School> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SchoolConfig.cs; Class=SchoolConfig; Properties=; Methods=Configure(EntityTypeBuilder<School> b)}.File)

## SchoolDto
- **Props:** Id, Name, Code, Status, ColorHex, Notes, BranchesCount, Id, Name, Code, Status, ColorHex, Notes
- Source: $(@{File=.\beaconta.Application\DTOs\SchoolDto.cs; Class=SchoolDto; Properties=Id, Name, Code, Status, ColorHex, Notes, BranchesCount, Id, Name, Code, Status, ColorHex, Notes; Methods=}.File)

## SchoolsController
- **Methods:** GetAll([FromQuery] bool? simple,
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] string? color); GetById(int id); GetMin(); IdNameDto(int Id, string Name); GetStats(); TransferDto(int ToSchoolId); TransferBranches(int id, [FromBody] TransferDto dto); Create([FromBody] SchoolUpsertDto dto); CheckCode([FromQuery] string code, [FromQuery] int? id = null); Update(int id, [FromBody] SchoolUpsertDto dto); Delete(int id, [FromQuery] bool force = false)
- Source: $(@{File=.\beaconta.Api\Controllers\SchoolsController.cs; Class=SchoolsController; Properties=; Methods=GetAll([FromQuery] bool? simple,
        [FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] string? color); GetById(int id); GetMin(); IdNameDto(int Id, string Name); GetStats(); TransferDto(int ToSchoolId); TransferBranches(int id, [FromBody] TransferDto dto); Create([FromBody] SchoolUpsertDto dto); CheckCode([FromQuery] string code, [FromQuery] int? id = null); Update(int id, [FromBody] SchoolUpsertDto dto); Delete(int id, [FromQuery] bool force = false)}.File)

## SchoolService
- **Methods:** GetAllAsync(); GetByIdAsync(int id); UpsertAsync(SchoolUpsertDto dto); DeleteAsync(int id, bool force = false); TransferBranchesAsync(int fromSchoolId, int toSchoolId)
- Source: $(@{File=.\beaconta.Infrastructure\Services\SchoolService.cs; Class=SchoolService; Properties=; Methods=GetAllAsync(); GetByIdAsync(int id); UpsertAsync(SchoolUpsertDto dto); DeleteAsync(int id, bool force = false); TransferBranchesAsync(int fromSchoolId, int toSchoolId)}.File)

## SchoolUpsertDto
- **Props:** Id, Name, Code, Status, ColorHex, Notes, BranchesCount, Id, Name, Code, Status, ColorHex, Notes
- Source: $(@{File=.\beaconta.Application\DTOs\SchoolDto.cs; Class=SchoolUpsertDto; Properties=Id, Name, Code, Status, ColorHex, Notes, BranchesCount, Id, Name, Code, Status, ColorHex, Notes; Methods=}.File)

## SchoolYearsController
- **Methods:** YearDto(int id,
        string? yearCode,
        string? name,
        int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص (Open | ClosedAcademic | Closed | Archived); UpsertDto(int? id,
        [Required] string yearCode,
        [Required] string name,
        [Required] int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص
        string? colorHex,
        bool isActive,
        int? financeBackPostDays,
        bool allowPaymentsOnClosedAcademic,
        string? notes); GetAll([FromQuery] int? branchId, [FromQuery] string? status, [FromQuery] bool? isActive, [FromQuery] string? q, CancellationToken ct); GetById([FromRoute] int id, CancellationToken ct); Current([FromQuery] int? branchId, CancellationToken ct); Create([FromBody] UpsertDto dto, CancellationToken ct); Update([FromRoute] int id, [FromBody] UpsertDto dto, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct); SetActiveReq(int branchId, int yearId); SetActive([FromBody] SetActiveReq req, CancellationToken ct); OverlapReq(int? id, int branchId, DateTime? startDate, DateTime? endDate); Overlaps([FromBody] OverlapReq req, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\SchoolYearsController.cs; Class=SchoolYearsController; Properties=; Methods=YearDto(int id,
        string? yearCode,
        string? name,
        int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص (Open | ClosedAcademic | Closed | Archived); UpsertDto(int? id,
        [Required] string yearCode,
        [Required] string name,
        [Required] int branchId,
        DateTime? startDate,
        DateTime? endDate,
        string status,              // نص
        string? colorHex,
        bool isActive,
        int? financeBackPostDays,
        bool allowPaymentsOnClosedAcademic,
        string? notes); GetAll([FromQuery] int? branchId, [FromQuery] string? status, [FromQuery] bool? isActive, [FromQuery] string? q, CancellationToken ct); GetById([FromRoute] int id, CancellationToken ct); Current([FromQuery] int? branchId, CancellationToken ct); Create([FromBody] UpsertDto dto, CancellationToken ct); Update([FromRoute] int id, [FromBody] UpsertDto dto, CancellationToken ct); Delete([FromRoute] int id, CancellationToken ct); SetActiveReq(int branchId, int yearId); SetActive([FromBody] SetActiveReq req, CancellationToken ct); OverlapReq(int? id, int branchId, DateTime? startDate, DateTime? endDate); Overlaps([FromBody] OverlapReq req, CancellationToken ct)}.File)

## SectionYear
- **Props:** Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt
- Source: $(@{File=.\beaconta.Domain\Entities\GradeYear.cs; Class=SectionYear; Properties=Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, Fees, Sections, Id, GradeYearId, Type, Name, Amount, GradeYear, Id, GradeYearId, Name, Capacity, Teacher, Notes, GradeYear, Status, UpdatedAt; Methods=}.File)

## SectionYearConfiguration
- **Methods:** Configure(EntityTypeBuilder<SectionYear> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SectionYearConfiguration.cs; Class=SectionYearConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<SectionYear> b)}.File)

## SectionYearDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=SectionYearDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## SectionYearsController
- **Methods:** ByGrade(int gradeYearId, CancellationToken ct); Create([FromBody] SectionYearUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); Bulk([FromBody] BulkDto dto, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\SectionYearsController.cs; Class=SectionYearsController; Properties=; Methods=ByGrade(int gradeYearId, CancellationToken ct); Create([FromBody] SectionYearUpsertDto dto, CancellationToken ct); GetById(int id, CancellationToken ct); Update(int id, [FromBody] SectionYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct); Bulk([FromBody] BulkDto dto, CancellationToken ct)}.File)

## SectionYearService
- **Methods:** GetByGradeYearAsync(int gradeYearId, CancellationToken ct); UpsertAsync(SectionYearUpsertDto dto, CancellationToken ct); BulkCreateAsync(int gradeYearId, IEnumerable<SectionYearUpsertDto> dtos, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); SetStatusAsync(int gradeYearId, int id, string status, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\SectionYearService.cs; Class=SectionYearService; Properties=; Methods=GetByGradeYearAsync(int gradeYearId, CancellationToken ct); UpsertAsync(SectionYearUpsertDto dto, CancellationToken ct); BulkCreateAsync(int gradeYearId, IEnumerable<SectionYearUpsertDto> dtos, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); SetStatusAsync(int gradeYearId, int id, string status, CancellationToken ct)}.File)

## SectionYearUpsertDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=SectionYearUpsertDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## SectionYearUpsertValidator
- Source: $(@{File=.\beaconta.Api\Validators\GradeYearUpsertValidator.cs; Class=SectionYearUpsertValidator; Properties=; Methods=}.File)

## SnapshotSync
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251002151147_SnapshotSync.Designer.cs; Class=SnapshotSync; Properties=; Methods=}.File)

## SnapshotSync
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20251002151147_SnapshotSync.cs; Class=SnapshotSync; Properties=; Methods=}.File)

## Stage
- **Props:** Id, SchoolId, BranchId, Name, Code, Color, SortOrder, Status, Shift, Notes
- Source: $(@{File=.\beaconta.Domain\Entities\Stage.cs; Class=Stage; Properties=Id, SchoolId, BranchId, Name, Code, Color, SortOrder, Status, Shift, Notes; Methods=}.File)

## StageDto
- **Props:** Id, Name, Code, SortOrder, Status, Notes, SchoolId, SchoolName, ColorHex
- Source: $(@{File=.\beaconta.Application\DTOs\StageDto.cs; Class=StageDto; Properties=Id, Name, Code, SortOrder, Status, Notes, SchoolId, SchoolName, ColorHex; Methods=}.File)

## StagesController
- **Methods:** GetAll([FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] int? schoolId); GetById(int id); GetStats(); Create([FromBody] StageUpsertDto dto); Update(int id, [FromBody] StageUpsertDto dto); Delete(int id); ToggleStatus(int id); BulkRequest(List<int> Ids, string Op); Bulk([FromBody] BulkRequest req); Export([FromQuery] string? q, [FromQuery] string? status, [FromQuery] int? schoolId)
- Source: $(@{File=.\beaconta.Api\Controllers\StagesController.cs; Class=StagesController; Properties=; Methods=GetAll([FromQuery] string? q,
        [FromQuery] string? status,
        [FromQuery] int? schoolId); GetById(int id); GetStats(); Create([FromBody] StageUpsertDto dto); Update(int id, [FromBody] StageUpsertDto dto); Delete(int id); ToggleStatus(int id); BulkRequest(List<int> Ids, string Op); Bulk([FromBody] BulkRequest req); Export([FromQuery] string? q, [FromQuery] string? status, [FromQuery] int? schoolId)}.File)

## StageService
- **Methods:** GetAllAsync(); GetByIdAsync(int id); UpsertAsync(StageUpsertDto dto); DeleteAsync(int id); ToggleStatusAsync(int id); BulkActivateAsync(List<int> ids); BulkDeactivateAsync(List<int> ids); BulkDeleteAsync(List<int> ids); ExportAsync(string? q, string? status, int? schoolId)
- Source: $(@{File=.\beaconta.Infrastructure\Services\StageService.cs; Class=StageService; Properties=; Methods=GetAllAsync(); GetByIdAsync(int id); UpsertAsync(StageUpsertDto dto); DeleteAsync(int id); ToggleStatusAsync(int id); BulkActivateAsync(List<int> ids); BulkDeactivateAsync(List<int> ids); BulkDeleteAsync(List<int> ids); ExportAsync(string? q, string? status, int? schoolId)}.File)

## StageUpsertDto
- **Props:** Id, Name, Code, SortOrder, Status, Notes, SchoolId, ColorHex
- Source: $(@{File=.\beaconta.Application\DTOs\StageUpsertDto.cs; Class=StageUpsertDto; Properties=Id, Name, Code, SortOrder, Status, Notes, SchoolId, ColorHex; Methods=}.File)

## Subject
- **Props:** Id, Code, Name, Hours, Note
- Source: $(@{File=.\beaconta.Domain\Entities\Subject.cs; Class=Subject; Properties=Id, Code, Name, Hours, Note; Methods=}.File)

## SubjectConfiguration
- **Methods:** Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\SubjectConfiguration.cs; Class=SubjectConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Subject> e); Configure(EntityTypeBuilder<FeeItemCatalog> e); Configure(EntityTypeBuilder<FeeBundle> e); Configure(EntityTypeBuilder<FeeBundleItem> e); Configure(EntityTypeBuilder<CurriculumTemplate> e); Configure(EntityTypeBuilder<FeeLink> e)}.File)

## SubjectsController
- **Methods:** Get([FromQuery] int? gradeYearId, [FromQuery] int? yearId, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\SubjectsController.cs; Class=SubjectsController; Properties=; Methods=Get([FromQuery] int? gradeYearId, [FromQuery] int? yearId, CancellationToken ct)}.File)

## SubjectsService
- **Methods:** GetSubjectsAsync(int? gradeYearId, int? yearId, CancellationToken ct = default)
- Source: $(@{File=.\beaconta.Infrastructure\Services\SubjectsService.cs; Class=SubjectsService; Properties=; Methods=GetSubjectsAsync(int? gradeYearId, int? yearId, CancellationToken ct = default)}.File)

## SwitchRolePermissionToMenuItem
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927173231_SwitchRolePermissionToMenuItem.Designer.cs; Class=SwitchRolePermissionToMenuItem; Properties=; Methods=}.File)

## SwitchRolePermissionToMenuItem
- Source: $(@{File=.\beaconta.Infrastructure\Migrations\20250927173231_SwitchRolePermissionToMenuItem.cs; Class=SwitchRolePermissionToMenuItem; Properties=; Methods=}.File)

## TermsCalendarProfile
- Source: $(@{File=.\beaconta.Application\Mapping\TermsCalendarProfile.cs; Class=TermsCalendarProfile; Properties=; Methods=}.File)

## TermsController
- **Methods:** List([FromQuery] int yearId, CancellationToken ct); GetById(int id, CancellationToken ct); Create([FromBody] TermYearUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] TermYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)
- Source: $(@{File=.\beaconta.Api\Controllers\TermsController.cs; Class=TermsController; Properties=; Methods=List([FromQuery] int yearId, CancellationToken ct); GetById(int id, CancellationToken ct); Create([FromBody] TermYearUpsertDto dto, CancellationToken ct); Update(int id, [FromBody] TermYearUpsertDto dto, CancellationToken ct); Delete(int id, CancellationToken ct)}.File)

## TermYear
- **Props:** Id, YearId, Year, Name, StartDate, EndDate, Status, WeekdaysCsv, ExamStart, ExamEnd, Notes, CreatedAt, UpdatedAt
- Source: $(@{File=.\beaconta.Domain\Entities\TermYear.cs; Class=TermYear; Properties=Id, YearId, Year, Name, StartDate, EndDate, Status, WeekdaysCsv, ExamStart, ExamEnd, Notes, CreatedAt, UpdatedAt; Methods=}.File)

## TermYearService
- **Methods:** GetByYearAsync(int yearId, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(TermYearUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); HasOverlapAsync(int yearId, DateTime start, DateTime end, int? ignoreId, CancellationToken ct)
- Source: $(@{File=.\beaconta.Infrastructure\Services\TermYearService.cs; Class=TermYearService; Properties=; Methods=GetByYearAsync(int yearId, CancellationToken ct); GetByIdAsync(int id, CancellationToken ct); UpsertAsync(TermYearUpsertDto dto, CancellationToken ct); DeleteAsync(int id, CancellationToken ct); HasOverlapAsync(int yearId, DateTime start, DateTime end, int? ignoreId, CancellationToken ct)}.File)

## TermYearUpsertValidator
- Source: $(@{File=.\beaconta.Api\Validators\TermsCalendarValidators.cs; Class=TermYearUpsertValidator; Properties=; Methods=}.File)

## TotalsDto
- **Props:** Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees
- Source: $(@{File=.\beaconta.Application\DTOs\GradeYearFeeDto.cs; Class=TotalsDto; Properties=Id, Type, Name, Amount, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, YearId, SchoolId, StageId, Name, Shift, Gender, Capacity, Tuition, SortOrder, Status, Notes, Fees, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, Id, GradeYearId, Name, Capacity, Teacher, Notes, Status, A, B, Grades, Sections, Capacity, Fees; Methods=}.File)

## UpdateRoleDto
- **Props:** Name
- Source: $(@{File=.\beaconta.Application\DTOs\UpdateRoleDto.cs; Class=UpdateRoleDto; Properties=Name; Methods=}.File)

## UpdateRolePermissionsDto
- **Props:** RoleId, PermissionIds
- Source: $(@{File=.\beaconta.Application\DTOs\UpdateRolePermissionsDto.cs; Class=UpdateRolePermissionsDto; Properties=RoleId, PermissionIds; Methods=}.File)

## User
- **Props:** FullName, Username, Email, Phone, PasswordHash, Status, Notes, LastLogin, UserRoles
- Source: $(@{File=.\beaconta.Domain\Entities\User.cs; Class=User; Properties=FullName, Username, Email, Phone, PasswordHash, Status, Notes, LastLogin, UserRoles; Methods=}.File)

## UserCreateDto
- **Props:** FullName, Username, Email, Phone, Password, RoleIds
- Source: $(@{File=.\beaconta.Application\DTOs\UserCreateDto.cs; Class=UserCreateDto; Properties=FullName, Username, Email, Phone, Password, RoleIds; Methods=}.File)

## UserDto
- **Props:** Id, FullName, Username, Email, Phone, Status, LastLogin, Roles, RoleIds
- Source: $(@{File=.\beaconta.Application\DTOs\UserDto.cs; Class=UserDto; Properties=Id, FullName, Username, Email, Phone, Status, LastLogin, Roles, RoleIds; Methods=}.File)

## UserProfileDto
- **Props:** Id, Username, FullName, Role, Permissions
- Source: $(@{File=.\beaconta.Application\DTOs\UserProfileDto.cs; Class=UserProfileDto; Properties=Id, Username, FullName, Role, Permissions; Methods=}.File)

## UserRole
- **Props:** UserId, RoleId, User, Role
- Source: $(@{File=.\beaconta.Domain\Entities\UserRole.cs; Class=UserRole; Properties=UserId, RoleId, User, Role; Methods=}.File)

## UsersController
- **Methods:** GetAll(); GetById(int id); Create(UserCreateDto dto); Update(int id, UserUpdateDto dto); Delete(int id); ToggleStatus(int id); ResetPassword(int id, [FromBody] string newPassword)
- Source: $(@{File=.\beaconta.Api\Controllers\UsersController.cs; Class=UsersController; Properties=; Methods=GetAll(); GetById(int id); Create(UserCreateDto dto); Update(int id, UserUpdateDto dto); Delete(int id); ToggleStatus(int id); ResetPassword(int id, [FromBody] string newPassword)}.File)

## UserService
- **Methods:** GetAllAsync(); GetByIdAsync(int id); CreateAsync(UserCreateDto dto); UpdateAsync(UserUpdateDto dto); DeleteAsync(int id); ToggleStatusAsync(int id); ResetPasswordAsync(int id, string newPassword)
- Source: $(@{File=.\beaconta.Infrastructure\Services\UserService.cs; Class=UserService; Properties=; Methods=GetAllAsync(); GetByIdAsync(int id); CreateAsync(UserCreateDto dto); UpdateAsync(UserUpdateDto dto); DeleteAsync(int id); ToggleStatusAsync(int id); ResetPasswordAsync(int id, string newPassword)}.File)

## UserUpdateDto
- **Props:** Id, FullName, Email, Phone, Status, RoleIds
- Source: $(@{File=.\beaconta.Application\DTOs\UserUpdateDto.cs; Class=UserUpdateDto; Properties=Id, FullName, Email, Phone, Status, RoleIds; Methods=}.File)

## WeatherForecast
- **Props:** Date, TemperatureC, Summary
- Source: $(@{File=.\beaconta.Api\WeatherForecast.cs; Class=WeatherForecast; Properties=Date, TemperatureC, Summary; Methods=}.File)

## WeatherForecastController
- **Methods:** Get()
- Source: $(@{File=.\beaconta.Api\Controllers\WeatherForecastController.cs; Class=WeatherForecastController; Properties=; Methods=Get()}.File)

## Year
- **Props:** Id, Code, Name, StartDate, EndDate, IsActive, BranchId, Status, ColorHex, Notes, FinanceBackPostDays, AllowPaymentsOnClosedAcademic, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
- Source: $(@{File=.\beaconta.Domain\Entities\Year.cs; Class=Year; Properties=Id, Code, Name, StartDate, EndDate, IsActive, BranchId, Status, ColorHex, Notes, FinanceBackPostDays, AllowPaymentsOnClosedAcademic, CreatedAt, CreatedBy, UpdatedAt, UpdatedBy; Methods=}.File)

## YearConfiguration
- **Methods:** Configure(EntityTypeBuilder<Year> b)
- Source: $(@{File=.\beaconta.Infrastructure\Data\Configurations\YearConfiguration.cs; Class=YearConfiguration; Properties=; Methods=Configure(EntityTypeBuilder<Year> b)}.File)


