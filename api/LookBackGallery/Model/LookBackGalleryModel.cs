using System.Collections.Generic;

namespace api.LookBackGallery.Model
{
    public class LookBackGalleryModel
    {
        public int Year { get; set; }

        public List<LookBackGalleryMonthModel> MonthList { get; set; }
    }

    public class LookBackGalleryMonthModel
    {
        public int Month { get; set; }

        public List<LookBackGalleryDayModel> DayList { get; set; }
    }

    public class LookBackGalleryDayModel
    {
        public int Day { get; set; }

        public List<string> UrlList { get; set; }
    }
}