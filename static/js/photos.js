$(document).ready(function () {
	$.getJSON("/static/json/photos-2020.json", function (monthList, status) {
		console.log("Status: " + status);
		$('#template1').tmpl(monthList).appendTo('#timeline-js')

		$("#timeline-js").css({
			"overflow": "auto",
			"width": "auto"
		});

		$("#timeline-js").css({
			"overflow": "auto",
			"width": "auto",
			"align-content":"center"
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