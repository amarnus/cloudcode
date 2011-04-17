CloudcodeClient.routes = SC.Object.create({
	routeHandler: function(params) {
		urlPath = NO;
		for (var i in params) {
			urlPath = params.i;
			break;
		}
		if (SC.none(urlPath) || !urlPath || typeof(urlPath) === undefined)
		  {}
		else
			CloudcodeClient.FileBrowser.openFile(urlPath);
	}
});