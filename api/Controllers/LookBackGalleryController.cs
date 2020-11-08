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
        private static string[] CNMONTH = new string[] { "", "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月" };
        private const string PHOTOHOST = "http://photoimg.2020.zhangyuan.net/";

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

                var fileUrl = PHOTOHOST + fileName;

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
                                        Day = ConvertDay(date),
                                        UrlList = new List<string> { fileUrl }
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
                                    Day = ConvertDay(date),
                                    UrlList = new List<string> { fileUrl }
                                }
                            }
                        };
                        paramYear.MonthList.Add(paramMonth);
                    }
                    else
                    {
                        var paramDay = paramMonth.DayList.FirstOrDefault(a => a.Day == ConvertDay(date));
                        if (paramDay == null)
                        {
                            paramDay = new LookBackGalleryDayModel
                            {
                                Day = ConvertDay(date),
                                UrlList = new List<string> { fileUrl }
                            };
                            paramMonth.DayList.Add(paramDay);
                        }
                        else
                        {
                            var paramFileName = paramDay.UrlList.FirstOrDefault(a => a == fileUrl);
                            if (paramFileName == null)
                                paramDay.UrlList.Add(fileUrl);
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

        private static string ConvertDay(DateTime date)
        {
            return String.Format("{0:D2}", date.Month) + "-" + String.Format("{0:D2}", date.Day);
        }

        private static LookBackGalleryModel GetModel(int year)
        {
            var str = System.IO.File.ReadAllText(string.Format(FILEPATH, year));
            return Newtonsoft.Json.JsonConvert.DeserializeObject<LookBackGalleryModel>(str);
        }
    }
}