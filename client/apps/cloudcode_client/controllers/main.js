/**
 * Main controller for the Cloudcode client application
 */
CloudcodeClient.mainController = SC.ObjectController.create({

	boot: function() {
		// Append the main pane; build the UI
	  CloudcodeClient.getPath('mainPage.mainPane').append();

	  // Get user information about the current user from the server (if possible)
	  new CloudcodeApi().getUser(function(response, xhr) {
			if (xhr.status == 200) {
			  CloudcodeClient.CURRENT_USER = JSON.parse(response);
			  var label = CloudcodeClient.mainPage.getPath('mainPane.header.currentUserInfo');
			  label.set("value", "You are currenly logged in as %@".fmt(CloudcodeClient.CURRENT_USER.email));
			  SC.RunLoop.end();
			}
		});
	  
	  // Initialize the editor
	  CloudcodeClient.editorController.boot();
	  
	  // Plug in the router
	  SC.routes.add(':', CloudcodeClient.routes, 'routeHandler');
	}

});