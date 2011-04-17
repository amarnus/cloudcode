CloudcodeClient.createProjectFormPane = SC.SheetPane.create({
  layout: { 
	  centerX: 0, 
	  height: 300, 
	  width: 400 
  },
  contentView: SC.View.design({
	  layout: { top: 0, left: 0, bottom: 0, right: 0 },
	  childViews: 'title fields closeButton createButton'.w(),
	  title: SC.LabelView.design({
	    layout: { top: 15, left: 15 },
	    value: 'Create Project',
	    fontWeight: SC.BOLD_WEIGHT
	  }), 
	  fields: SC.View.design({
	    childViews: 'title description template'.w(),
	    layout: { left: 15, right: 15 },
	    title: SC.View.design({
	      childViews: 'label field'.w(),
	      layout: { top: 50, height: 50 },
	      label: SC.LabelView.design({
	        layout: { top: 0, height: 20 },
	        value: 'Name',
	        fontWeight: SC.BOLD_WEIGHT,
	        controlSize: SC.SMALL_CONTROL_SIZE
	      }),
	      field: SC.TextFieldView.design({
	        layout: { bottom: 0, height: 25 },
	        hint: 'Name of the project..',
	        valueBinding: 'CloudcodeClient.createProjectFormController.title'
	      })
	    }),
		  description: SC.View.design({
		    childViews: 'label field'.w(),
	      layout: { top: 115, height: 75 },
	      label: SC.LabelView.design({
	        layout: { top: 0, height: 20 },
	        value: 'Description',
	        fontWeight: SC.BOLD_WEIGHT,
	        controlSize: SC.SMALL_CONTROL_SIZE
	      }),
	      field: SC.TextFieldView.design({
	      	classNames: [ 'projectDescription' ],
	      	isTextArea: true,
	        layout: { bottom: 0, height: 50 },
	        hint: 'Brief description of what your project is about..',
	        valueBinding: 'CloudcodeClient.createProjectFormController.description'
		    })
	    }),
	    template: SC.View.design({
	    	childViews: "label field".w(),
	    	layout: { top: 205, height: 75 },
	    	label: SC.LabelView.design({
	    	  layout: { top: 0, height: 20 },
	    	  value: 'Template',
	    	  fontWeight: SC.BOLD_WEIGHT,
	    	  controlSize: SC.SMALL_CONTROL_SIZE
	    	}),
	    	field: SC.SelectFieldView.design({
	    		layout: { centerY: 0, top: 20 },
	    		objectsBinding: "CloudcodeClient.FileBrowser.projects",
	    		nameKey: "title",
	    	  valueKey: "pid",
	    	  emptyName: "None",
	    	  valueBinding: "CloudcodeClient.createProjectFormController.templateFrom"
	    	})
	    })
 	  }),
	  closeButton: SC.ButtonView.design({
	    layout: { width: 80, height: 30, right: 100, bottom: 15 },
	    titleMinWidth: 0,
	    title: 'Cancel',
	    theme: 'capsule',
	    isCancel: YES,
	    target: 'CloudcodeClient.createProjectFormController',
	    action: 'close'
	  }),
	  createButton: SC.ButtonView.design({
	    layout: { width: 80, height: 30, right: 15, bottom: 15 },
	    titleMinWidth: 0,
	    keyEquivalent: 'return',
	    isDefault: YES,
	    theme: 'capsule',
	    title: "Create",
	    target: 'CloudcodeClient.createProjectFormController',
	    action: 'create'
	  })
	})
});
  
  