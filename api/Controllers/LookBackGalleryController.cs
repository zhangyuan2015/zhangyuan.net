using api.LookBackGallery.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

namespace api.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LookBackGalleryController : ControllerBase
    {
        private const string FILEPATH = "./LookBackGallery/File/Data_{0}.json";
        private static string[] CNMONTH = new string[] { "", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二" };

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

        [HttpGet]
        [Route("GenerateDataJson")]
        public List<LookBackGalleryModel> GenerateDataJson(string fileNameText)
        {
            return GenerateDataJsonService(fileNameText);
        }

        private static List<LookBackGalleryModel> GenerateDataJsonService(string fileNameText)
        {
            List<LookBackGalleryModel> paramList = new List<LookBackGalleryModel>();
            List<string> fileNameList = fileNameText.Replace(Environment.NewLine, "^").Split(new char[] { '^', ' ', ',' }, StringSplitOptions.RemoveEmptyEntries).ToList();
            foreach (var fileName in fileNameList)
            {
                var fileNameSpl = fileName.Split(new char[] { '-', '.' }, StringSplitOptions.RemoveEmptyEntries);
                var date = DateTime.ParseExact(fileNameSpl[0], "yyyyMMdd", CultureInfo.InvariantCulture);

                var paramYear = paramList.FirstOrDefault(a => a.Year == date.Year.ToString());
                if (paramYear == null)
                {
                    paramYear = new LookBackGalleryModel
                    {
                        Year = date.Year.ToString(),
                        MonthList = new List<LookBackGalleryMonthModel> {
                            new LookBackGalleryMonthModel {
                                Month = CNMONTH[date.Month],
                                DayList = new List<LookBackGalleryDayModel> {
                                    new LookBackGalleryDayModel {
                                        Day = date.Day.ToString(),
                                        UrlList = new List<string> { fileName }
                                    }
                                }
                            }
                        }
                    };
                    paramList.Add(paramYear);
                }
                else
                {
                    var paramMonth = paramYear.MonthList.FirstOrDefault(a => a.Month == CNMONTH[date.Month]);
                    if (paramMonth == null)
                    {
                        paramMonth = new LookBackGalleryMonthModel
                        {
                            Month = CNMONTH[date.Month],
                            DayList = new List<LookBackGalleryDayModel> {
                                new LookBackGalleryDayModel {
                                    Day = date.Day.ToString(),
                                    UrlList = new List<string> { fileName }
                                }
                            }
                        };
                        paramYear.MonthList.Add(paramMonth);
                    }
                    else
                    {
                        var paramDay = paramMonth.DayList.FirstOrDefault(a => a.Day == date.Day.ToString());
                        if (paramDay == null)
                        {
                            paramDay = new LookBackGalleryDayModel
                            {
                                Day = date.Day.ToString(),
                                UrlList = new List<string> { fileName }
                            };
                            paramMonth.DayList.Add(paramDay);
                        }
                        else
                        {
                            var paramFileName = paramDay.UrlList.FirstOrDefault(a => a == fileName);
                            if (paramFileName == null)
                                paramDay.UrlList.Add(fileName);
                        }
                    }
                }
            }

            foreach (var param in paramList)
            {
                System.IO.File.WriteAllText(string.Format(FILEPATH, param.Year), Newtonsoft.Json.JsonConvert.SerializeObject(param));
            }

            return paramList;
        }

        private static LookBackGalleryModel GetModel(int year)
        {
            var str = System.IO.File.ReadAllText(string.Format(FILEPATH, year));
            return Newtonsoft.Json.JsonConvert.DeserializeObject<LookBackGalleryModel>(str);
        }
    }
}
