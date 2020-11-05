using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LookBackGalleryController : ControllerBase
    {
        private readonly ILogger<LookBackGalleryController> _logger;

        public LookBackGalleryController(ILogger<LookBackGalleryController> logger)
        {
            _logger = logger;
        }

        [HttpGet]
        public LookBackGalleryModel Get(int year)
        {
            return GetModel(year);
        }

        private LookBackGalleryModel GetModel(int year)
        {
            List<LookBackGalleryModel> resList = new List<LookBackGalleryModel>();
            resList.Add(new LookBackGalleryModel
            {
                Year = 2020,
                MonthList = new List<LookBackGalleryMonthModel>() {
                    new LookBackGalleryMonthModel {
                        Month = 1,
                        DayList = new List<LookBackGalleryDayModel> {
                            new LookBackGalleryDayModel {
                                Day = 0117, UrlList = new List<string> { "http://photoimg.2020.zhangyuan.net/20200117.JPG"}
                            },
                            new LookBackGalleryDayModel {
                                Day = 0127, UrlList = new List<string> { "http://photoimg.2020.zhangyuan.net/20200127.JPG" }
                            }
                        }
                    },
                    new LookBackGalleryMonthModel {
                        Month = 2,
                        DayList = new List<LookBackGalleryDayModel> {
                            new LookBackGalleryDayModel {
                                Day = 0213, UrlList = new List<string> { "http://photoimg.2020.zhangyuan.net/20200213.JPG" }
                            }
                        }
                    }
                    ,
                    new LookBackGalleryMonthModel {
                        Month = 3,
                        DayList = new List<LookBackGalleryDayModel> {
                            new LookBackGalleryDayModel {
                                Day = 0301, UrlList = new List<string> { "http://photoimg.2020.zhangyuan.net/20200301-01.JPG", "http://photoimg.2020.zhangyuan.net/20200301-02.JPG" }
                            },
                            new LookBackGalleryDayModel {
                                Day = 0302, UrlList = new List<string> { "http://photoimg.2020.zhangyuan.net/20200302-01.JPG", "http://photoimg.2020.zhangyuan.net/20200302-02.JPG" }
                            }
                        }
                    }
                }
            });

            return resList.FirstOrDefault(a => a.Year == year);
        }
    }
}
