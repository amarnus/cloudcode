CloudcodeClient.createFileFormPane = SC.SheetPane.create({
  layout: { 
	  centerX: 0, 
	  height: 215, 
	  width: 400 
  },
  contentView: SC.View.design({
	  layout: { top: 0, left: 0, bottom: 0, right: 0 },
	  childViews: 'title fields closeButton createButton'.w(),
	  title: SC.LabelView.design({
	    layout: { top: 15, left: 15 },
	    value: 'Create File',
	    fontWeight: SC.BOLD_WEIGHT
	  }), 
	  fields: SC.View.design({
	    childViews: 'title type'.w(),
	    layout: { left: 15, right: 15 },
	    title: SC.View.design({
	      childViews: 'label field'.w(),
	      layout: { top: 50, height: 45 },
	      label: SC.LabelView.design({
	        layout: { top: 0, height: 20 },
	        value: 'Name',
	        fontWeight: SC.BOLD_WEIGHT,
	        controlSize: SC.SMALL_CONTROL_SIZE
	      }),
	      field: SC.TextFieldView.design({
	        layout: { bottom: 0, height: 25 },
	        hint: 'Name of the File or Folder',
	        valueBinding: 'CloudcodeClient.createFileFormController.title'
	      })
	    }),
	    type: SC.View.design({
	      childViews: 'label field'.w(),
	      layout: { top: 115, height: 75 },
	      label: SC.LabelView.design({
	        layout: { top: 0, height: 20 },
	        value: 'Type',
	        fontWeight: SC.BOLD_WEIGHT,
	        controlSize: SC.SMALL_CONTROL_SIZE
	      }),
	      field: SC.SelectFieldView.design({
	        layout: { top: 20, centerY: 0 },
	        objects: CloudcodeClient.ALLOWED_FILE_TYPES,
	        nameKey: 'name',
	        disableSort: YES,
	        valueBinding: 'CloudcodeClient.createFileFormController.type'
	      })	    	
	    })
 	  }),
	  closeButton: SC.ButtonView.design({
	    layout: { width: 80, height: 30, right: 100, bottom: 15 },
	    titleMinWidth: 0,
	    title: 'Cancel',
	    theme: 'capsule',
	    isCancel: YES,
	    target: 'CloudcodeClient.createFileFormController',
	    action: 'close'
	  }),
	  createButton: SC.ButtonView.design({
	    layout: { width: 80, height: 30, right: 15, bottom: 15 },
	    titleMinWidth: 0,
	    keyEquivalent: 'return',
	    isDefault: YES,
	    theme: 'capsule',
	    title: "Create",
	    target: 'CloudcodeClient.createFileFormController',
	    action: 'create'
	  })
	})
});