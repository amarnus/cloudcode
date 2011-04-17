sc_require('views/file_item');
sc_require('views/editor');

CloudcodeClient.mainPage = SC.Page.design({
	revisionPane: SC.Pane.design({
		acceptsKeyPane: YES,
		willBecomeKeyPaneFrom: function(pane) {
			this.set('isKeyPane', YES);
		},
		layout: { width: 300, right: 0, top: 32, bottom: 0 },
		isContextMenuEnabled: NO,
		classNames: [ "rightSideBar" ],
  	childViews: "fileInfo".w(),
  	fileInfo: SC.View.design({
  		childViews: "title block".w(),
    	title: SC.LabelView.design({
	    	classNames: [ "blockTitle" ],
	    	layout: { height: 25, left: 0, right: 0, top: 5 },
	    	value: "Revisions",
	    	textAlign: SC.ALIGN_CENTER
	    }),
	    block: SC.ScrollView.design({
	    	layout: { top: 25, height: 250, left: 5, right: 5 },
		    hasHorizontalScroller: NO,
		    hasVerticalScroller: YES,
		    acceptsFirstResponder: YES,
		  	contentView: SC.ListView.design({
		    	willBecomeKeyResponderFrom: function(responder) {
		    		this.set("isKeyResponder", YES);
		    	},
		  		acceptsFirstResponder: YES,
		  		contentBinding: "CloudcodeClient.revisionController.arrangedObjects",
		  		selectionBinding: "CloudcodeClient.revisionController.selection",
		  		rowHeight: 27,
		  		contentValueKey: 'utcCreated',
		  		target: "CloudcodeClient.revisionController",
		  		action: "openRevision"
		  	})
	    })
  	})
	}),
  mainPane: SC.MainPane.design({
	  isContextMenuEnabled: NO,
    childViews: "header content".w(),
    header: SC.ToolbarView.design({
    	classNames: [ "northToolBar" ],
    	backgroundColor: "#F1F1F1",
      layout: { left: 0, right: 0, top: 0, height: 30 },
      anchorPosition: SC.ANCHOR_TOP,
      childViews: "currentUserInfo".w(),
      currentUserInfo: SC.LabelView.design({
      	classNames: [ "meta" ],
      	layout: { centerY: 0, height: 20, width: 300 },
      	textAlign: SC.ALIGN_CENTER,
      	escapeHTML: YES
      })
    }),
    content: SC.SplitView.design({
	    layout: { top: 32, left: 0, right: 0, bottom: 0 },
	    defaultThickness: 0.20,
	    canCollapseViews: YES,
	    topLeftView: SC.View.design({
	    	classNames: [ "leftSideBar" ],
	    	acceptsFirstResponder: YES,
		    childViews: "fileBrowser".w(),
		    fileBrowser: SC.View.design({
		    	childViews: "title block projectSearch actions".w(),
		    	title: SC.LabelView.design({
			    	classNames: [ "blockTitle" ],
			    	layout: { height: 25, left: 0, right: 0, top: 5 },
			    	value: "Projects",
			    	textAlign: SC.ALIGN_CENTER
			    }),
		    	block: SC.ScrollView.design({
			    	layout: { top: 25, height: 400, left: 5, right: 5 },
			    	acceptsFirstResponder: YES,
				    hasHorizontalScroller: NO,
				    hasVerticalScroller: YES,
				    contentView: SC.ListView.design({
				    	willBecomeKeyResponderFrom: function(responder) {
				    		this.set("isKeyResponder", YES);
				    	},
				    	acceptsFirstResponder: YES,
			        contentValueKey: 'title',
			        contentIconKey: 'icon',
			        contentUnreadCountKey: 'childrenCount',
			        hasContentIcon: YES,
			        exampleView: CloudcodeClient.FileItemView,
		          rowHeight: 24,
		          contentBinding: 'CloudcodeClient.FileBrowser.arrangedObjects',
		          canEditContent: NO,
		          canDeleteContent: NO,
		          canReorderContent: YES,
		          isContextMenuEnabled: NO,
		          delegate: CloudcodeClient.FileBrowser,
		          selectionBinding: 'CloudcodeClient.FileBrowser.selection',
		          target: 'CloudcodeClient.FileBrowser',
		          action: 'openFile',
							selectionEvent: null,
	            mouseDown: function(event) {
							  var ret = sc_super();
	              if (event.which === 3) {
		              this.set('selectionEvent', event);
	                this.invokeLast('popupContextMenu');
	              }
	              return ret;
	            },
						  popupContextMenu: function() {
		            var pane = SCUI.ContextMenuPane.create({
		              contentView: SC.View.design({}),
		              layout: { width: 125, height: 0 },
		              itemTitleKey: 'title',
		              itemTargetKey: 'target',
		              itemActionKey: 'action',
		              items: CloudcodeClient.FileBrowser.actions
		            });
		            pane.popup(this, this.get('selectionEvent')); // pass in the mouse event so the pane can figure out where to put itself
					    }
				    })
			    }),
			    projectSearch: SC.TextFieldView.design({
				  	layout: { centerY: 0, centerX: 0, top: 430, right: 5, left: 5, height: 25 },
				  	hint: 'Search your projects..',
				  	valueBinding: "CloudcodeClient.FileBrowser.searchText"
				  }),
			    actions: SC.View.design({
			    	layout: { left: 5, right: 5, height: 50, top: 465 },
			    	childViews: 'createProject summary'.w(),
			    	createProject: SC.ButtonView.design({
			    		classNames: [ 'button' ],
			    		layout: { width: 180, height: 50, centerY: 0, centerX: 0 },
			    		titleMinWidth: 0,
			    		title: '+ Create Project',
			    		theme: 'capsule',
			    		target: 'CloudcodeClient.FileBrowser',
			    		action: 'createProject',
			    		icon: 'sc-icon-folder-16',
			    		controlSize: SC.SMALL_CONTROL_SIZE
			    	}),
			    	summary: SC.LabelView.design({
			    		classNames: [ 'projectsInfo' ],
			    		layout: { left: 5, height: 25, top: 60, centerX: 0, right: 5 },
			    		value: 'Hello World',
			    	  controlSize: SC.SMALL_CONTROL_SIZE
			    	})
			    })
		    })
	    }), 
	    dividerView: SC.SplitDividerView,
	    bottomRightView: SC.ContainerView.design({
    		layout: { top: 50, left: 10, right: 10, bottom: 0 },
		    contentView: SC.View.extend({
			    childViews: 'editorView staticEditorView'.w(),
		    	editorView: CloudcodeClient.CodeEditorView,
		    	staticEditorView: CloudcodeClient.StaticEditorView
		    })
	    })
    }) // end of content
  }) // end of mainPane
}); // end of mainPage




/**
 * dividerView: SC.SplitDividerView,
			  bottomRightView: SC.View.design({
			  	
			  	})*/
