$(document).ready(function () {
	$.get("http://23.105.193.208:5000/LookBackGallery?year=2020", function (data, status) {
		console.log("Status: " + status);
		$('#template1').tmpl(data).appendTo('#timeline-js')

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