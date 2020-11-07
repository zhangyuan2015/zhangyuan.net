using System.Collections.Generic;

namespace api.LookBackGallery.Model
{
    public class LookBackGalleryModel
    {
        public string Year { get; set; }

        public List<LookBackGalleryMonthModel> MonthList { get; set; }
    }

    public class LookBackGalleryMonthModel
    {
        public string Month { get; set; }

        public List<LookBackGalleryDayModel> DayList { get; set; }
    }

    public class LookBackGalleryDayModel
    {
        public string Day { get; set; }

        public List<string> UrlList { get; set; }
    }
}