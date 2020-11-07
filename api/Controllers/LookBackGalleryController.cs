using api.LookBackGallery.Model;
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

        private static LookBackGalleryModel GetModel(int year)
        {
            var str = System.IO.File.ReadAllText(@$"./LookBackGallery/File/Data_{year}.json");
            return Newtonsoft.Json.JsonConvert.DeserializeObject<LookBackGalleryModel>(str);
        }
    }
}
