CloudcodeClient.StaticEditorView = SC.View.design({
	isVisible: NO,
	childViews: 'editor'.w(),
	editor: SC.View.extend({
		layout: { left: 20, right: 0, bottom: 40, top: 42 },
		classNames: [ 'cloudcode-editor' ],
		render: function(context, firstTime) {
		  context.begin('div').attr('id', 'static_code').end();
	  }
	})
});

CloudcodeClient.CodeEditorView = SC.View.design({
	isVisible: NO,
	willBecomeKeyResponderFrom: function(responder) {},
	willLoseKeyResponderTo: function(responder) {
		CloudcodeClient.editorController.blur();
	},
	layout: { right: 300 },
	acceptsFirstResponder: YES,
	childViews: 'controlsTop editor controlsBottom'.w(),
	controlsTop: SC.ContainerView.design({
	  classNames: [ 'editorControlsTopView' ], 
	  layout: { left: 0, right: 0, top: 0, height: 40 },
	  contentView: SC.View.extend({
		  childViews: 'filePath find'.w(),
      filePath: SC.LabelView.design({
				controlSize: SC.SMALL_CONTROL_SIZE,
				escapeHTML: NO,
	      layout: { centerY: 0, height: 40, top: 15, left: 10, width: 250 },
	      valueBinding: "CloudcodeClient.editorController.filePath"
			}),
		  find: SC.View.extend({
			  layout: { centerY: 0, centerX: 0, top: 8, right: 0, height: 40 },
			  childViews: 'findField'.w(),
			  findField: SC.TextFieldView.design({
			  	layout: { centerY: 0, centerX: 0, top: 0, right: 130, height: 25, width: 300 },
			  	hint: 'Search this file..',
			  	valueBinding: "CloudcodeClient.editorController.searchText"
			  })
		  })
	  })
  }),
	editor: SC.View.extend({
		layout: { left: 0, right: 0, bottom: 40, top: 42 },
		classNames: [ 'cloudcode-editor' ],
		render: function(context, firstTime) {
		  context.begin('textarea').attr('id', 'code').attr('name', 'code').end();
	  }
	}),
	controlsBottom: SC.ContainerView.design({
	  classNames: [ 'editorControlsBottomView' ], 
	  layout: { left: 0, right: 0, bottom: 0, height: 40 },
	  contentView: SC.View.extend({
		  childViews: 'cursorPosition lineCount revisionId save'.w(),
		  cursorPosition: SC.LabelView.design({
		  	controlSize: SC.SMALL_CONTROL_SIZE,
		  	escapeHTML: NO,
	      layout: { centerY: 0, height: 40, top: 15, left: 10 },
	      valueBinding: "CloudcodeClient.editorController.cursorPosition"
      }),
		  lineCount: SC.LabelView.design({
		  	controlSize: SC.SMALL_CONTROL_SIZE,
		  	escapeHTML: NO,
	      layout: { centerY: 0, height: 40, top: 15, left: 110 },
	      valueBinding: "CloudcodeClient.editorController.lineCount"
      }),
		  revisionId: SC.LabelView.design({
		  	controlSize: SC.SMALL_CONTROL_SIZE,
		  	escapeHTML: NO,
	      layout: { centerY: 0, height: 40, top: 15, left: 210 },
	      valueBinding: "CloudcodeClient.editorController.revision"
      }),
		  save: SC.ButtonView.design({
			  classNames: [ 'button' ],
			  layout: { centerY: 0, centerX: 0, top: 8, right: 20, height: 40, width: 100 },
			  title: 'Save',
			  target: 'CloudcodeClient.FileBrowser',
			  action: 'saveFile',
			  theme: 'capsule'
		  })
	  })
  })
}); 