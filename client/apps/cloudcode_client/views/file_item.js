CloudcodeClient.FileItemView = SC.ListItemView.extend({
	content: null,  
	acceptsFirstResponder: YES,
	inlineEditorShouldBeginEditing: function() {
		return YES;	
	},
	inlineEditorWillBeginEditing: function() {
		return YES;
	},
	inlineEditorDidBeginEditing: function() {
		return YES;
	},
	inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
		CloudcodeClient.FileBrowser.startEditing(finalValue); // Delegate work to controller
		return YES; 
	},  
	render: function(context, firstTime) {
		sc_super();
	},
	createChildViews: function() {
		sc_super();
	}
});