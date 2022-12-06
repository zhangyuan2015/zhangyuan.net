$(document).ready(function () {
	var year = getQueryVariable("year");
	var title = "Yuan photos " + year;
	document.title = title;
	$("#h1Title").text(title);

	$.getJSON("/static/json/photos-" + year + ".json", function (data, status) {
		console.log("Status: " + status);

		var dataList = [];
		data.forEach(d => {
			var yearDto = dataList.find(function (item) { return item.year == d.year; });

			//var yearDto = dataList.map(a => a.year == d.year);
			if (yearDto == null) {
				yearDto = { year: d.year, monthList: [{ month: d.month, dayList: [{ day: d.day, urlList: [d.url] }] }] };
				dataList.push(yearDto);
			} else {
				var monthDto = yearDto.monthList.find(function (item) { return item.month == d.month; });
				if (monthDto == null) {
					monthDto = { month: d.month, dayList: [{ day: d.day, urlList: [d.url] }] };
					yearDto.monthList.push(monthDto)
				}
				else {
					var dayDto = monthDto.dayList.find(function (item) { return item.day == d.day; });
					if (dayDto == null) {
						dayDto = { day: d.day, urlList: [d.url] };
						monthDto.dayList.push(dayDto)
					} else {
						dayDto.urlList.push(d.url);
					}
				}
			}
		});

		$('#template1').tmpl(dataList).appendTo('#timeline-js')

		$("#timeline-js").css({
			"overflow": "auto",
			"width": "auto"
		});

		$("#timeline-js").css({
			"overflow": "auto",
			"width": "auto",
			"align-content": "center"
		});

		$(".container").css({
			"width": "auto"
		});

		$.timeliner({});
		$.timeliner({
			timelineContainer: '#timeline-js',
			timelineSectionMarker: '.milestone',
			oneOpen: true,
			startState: 'open',
			expandAllText: '+ 展开所有',
			collapseAllText: '- 折叠所有'
		});
		// Colorbox Modal
		$(".CBmodal").colorbox({ rel: 'group', transition: "fade", width: "90%", height: "90%" });
	});
});