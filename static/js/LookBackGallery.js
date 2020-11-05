$(document).ready(function () {
    $.get("http://localhost:5000/LookBackGallery?year=2020", function (data, status) {
        console.log("Status: " + status);
        $('#template1').tmpl(data).appendTo('#timeline-js')

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