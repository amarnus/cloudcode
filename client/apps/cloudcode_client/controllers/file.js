sc_require('core');
sc_require('models/user');
sc_require('models/project');
sc_require('models/file');
sc_require('models/revision');
sc_require('data_sources/store');

CloudcodeClient.FileBrowser = SC.TreeController.create(SC.CollectionViewDelegate, {
	  allowsMultipleContent: YES,
	  allowsMultipleSelection: YES,	
	  isEditable: YES,
	  projects: [],
	  searchText: null,
	  
	  collectionViewDragDataTypes: function(view) {
	  	return [ CloudcodeClient.File ];
	  },
	  
	  collectionViewComputeDragOperations: function(view, drag, proposedDragOperations) {
	  	if (drag.hasDataType(CloudcodeClient.File)) {
	  		return SC.DRAG_MOVE;
	  	}
	  	else {
	  		return SC.DRAG_NONE;
	  	}
	  },
	  
	  collectionViewDragDataForType: function(view, drag, dataType) {
	  	if (dataType == CloudcodeClient.File) {
	  		return [ this.getCurrentFile() ];
	  	}
	  },
	  
	  collectionViewPerformDragOperation: function(view, drag, dragOp, idx, dropOp) {
	  	var ret = SC.DRAG_MOVE;
	  	if (idx < 0) {
	  		return ret;
	  	}
	  	var source = drag.dataForType(CloudcodeClient.File).objectAt(0);
	  	var target = this.get('arrangedObjects').objectAt(idx);
	  	if (target.get('is_directory')) {
	  		var path = target.get('path') + source.get('path');
	  		source.set('path', path);
	  		source.set('parent', target);
	  		source.commitRecord({ tfid: target.get('fid') });
	  		return ret;
	  	}
	  	else {
	  		return SC.DRAG_NONE;
	  	}
	  },
	  
	  onSearchTextChange: function() {
	  	var searchText, content, children, i = 0, child; 
	  	searchText = this.get('searchText');
	  	content = this.get('content');
	  	children = content.get('treeItemChildren');
	  	for (; i < children.get('length'); i++) {
	  		child = children.objectAt(i);
	  		child.search("^%@.*".fmt(searchText));
	  	}
	  }.observes('searchText'),
	  
	  collectionViewShouldDeleteIndexes: function(view, indexes) {
	    return indexes;
    },
    
    alertPaneDidDismiss: function(pane, status) {
    	switch(status) {
    		case SC.BUTTON1_STATUS:
    			var file = this.get('selection').nextObject(0, null, {});
    			file.destroy();
    			// Destroy all file revisions also
    			file.commitRecord({ file: file });
    			break;
    	}
    },

	  actions: function() {
		  var file = null;
		  var selection = CloudcodeClient.FileBrowser.get('selection');
		  var len = selection ? selection.length() : 0;
		  var context = {};
		  var addFolderItem = SC.Object.create({
			  title: 'Add a Folder',
			  target: 'CloudcodeClient.FileBrowser',
			  action: 'createFolder'
		  });
		  var createFromTemplate = SC.Object.create({
		  	title: 'Create from template',
		  	target: 'CloudcodeClient.FileBrowser',
		  	action: 'createProject'
		  });
		  var addFileItem = SC.Object.create({
			  title: 'Add a File',
			  target: 'CloudcodeClient.FileBrowser',
			  action: "createFile"
		  });
		  var deployApp = SC.Object.create({
		  	title: "Deploy",
		  	target: "CloudcodeClient.FileBrowser",
		  	action: "deployApp"
		  });
		  var renameItem = SC.Object.create({
			  title: 'Rename',
			  target: 'CloudcodeClient.FileBrowser',
			  action: 'renameFile'
		  });
		  var deleteItem = SC.Object.create({
			  title: 'Remove',
			  target: 'CloudcodeClient.FileBrowser',
			  action: 'removeFile'
		  });
		  var minifyItem = SC.Object.create({
		  	title: 'Minify',
		  	target: 'CloudcodeClient.FileBrowser',
		  	action: 'minifyFile'
		  });
		  for(var i = 0; i < len; i++) { // For loops are ugly..
			  var file = selection.nextObject(i, null, context);
			  if (file.get('is_directory') == 1) {
				  return [ addFolderItem, deployApp, createFromTemplate, addFileItem, renameItem, deleteItem ];
			  }
			  else if (file.get('ext') == 'js') {
				  return [ minifyItem, renameItem, deleteItem ];
			  }
			  else {
			  	return [ renameItem, deleteItem ];
			  }
		  }
		  return NO;
	  }.property(),
	  
	  deployApp: function() {
	  	var file = this.getCurrentFile(), pid, vid;
	  	if (file) {
	  		pid = file.get('pid');
	  		if (chrome) {
	  			chrome.tabs.create({ url: CloudcodeClient.SERVER_URL + '/project/' + pid });
	  		}
	  	}
	  },
	  
	  selectFile: function(file) {
	  	var index = this.get('arrangedObjects').indexOf(file); 
	  	var fileItem = CloudcodeClient.mainPage.getPath('mainPane.content.topLeftView.fileBrowser.block.contentView').itemViewForContentIndex(index);
	    if (fileItem) {
	    	fileItem.set('isSelected', YES);
	    	this.openFile();
	    }
	  },
	  
	  renameFile: function() {
	  	var file = this.get('selection').nextObject(0, null, {});
	  	var index = this.get('arrangedObjects').indexOf(file); 
	    var list = CloudcodeClient.mainPage.getPath('mainPane.content.topLeftView.fileBrowser.block.contentView');
      var listItem = list.itemViewForContentIndex(index);
      listItem.beginEditing();
	  },
	  
	  removeFile: function() {
	  	var file, title, resource;
	  	file = this.get('selection').nextObject(0, null, {});
	  	title = file.get('title');
	  	if (!file.get('parent')) {
	  		resource = 'project';
	  	}
	  	else if(file.get('is_directory')) {
	  		resource = 'folder';
	  	}
	  	else {
	  		resource = 'file';
	  	}
	  	SC.AlertPane.warn('Delete confirmation', 'Are you sure you want to delete the %@ %@'.fmt(resource, title), null, "Yes", "Cancel", CloudcodeClient.FileBrowser);
	  },
	  
	  getCurrentFile: function() {
	  	return this.get('selection').nextObject(0, null, {});
	  },
	  
	  createFolder: function() {
	  	var file = this.getCurrentFile();
	  	CloudcodeClient.createFileFormController.open(file, true);
	  },
	  
	  createFile: function(isDirectory) {
	  	var file = this.getCurrentFile();
	  	CloudcodeClient.createFileFormController.open(file, false);
	  },
	  
	  createProject: function() {
	  	CloudcodeClient.createProjectFormController.open();
	  },
		
		openFile: function() {
			var file = this.getCurrentFile();
			if (file) {
				var isDirectory = file.get('is_directory');
				var content = file.get('content');
			  if (!isDirectory) {
			  	var query = SC.Query.create({
			  		conditions: "fid = {fid}",
			  		parameters: { 
			  			fid: file.get('fid') 
			  		},
			  		location: SC.Query.LOCAL,
			  		recordType: CloudcodeClient.Revision,
			  		orderBy: "created DESC"
			  	});
			  	var revisions = CloudcodeClient.store.find(query);
			  	var revisionPane = CloudcodeClient.getPath('mainPage.revisionPane');
				  revisionPane.append();
				  revisionPane.becomeKeyPane();
			  	CloudcodeClient.revisionController.set('content', revisions);
			  	var content = file.get('revision').get('content');
			  	CloudcodeClient.editorController.addContent(file, content);
			  }
			}
		},
		
		saveFile: function() {
			var content, file;
			content = CloudcodeClient.editorController.getContent();
			file = this.getCurrentFile(); 
			if (content && (content.length > 0) && file && (file.get('revision').get('content') != content)) {
				var dataHash = {
					title: file.get('revision').get('title'),
					fid: file.get('id'),
					content: content,
					pvid: file.get('revision').get('pvid'),
					user: CloudcodeClient.CURRENT_USER
				};
				var record = CloudcodeClient.store.createRecord(CloudcodeClient.Revision, dataHash);
				CloudcodeClient.store.commitRecord(CloudcodeClient.Revision, record.get('id'), record.get('storeKey'), { data: dataHash, file: file });
			}
		},
		
		startEditing: function(finalValue) {
			var file = this.getCurrentFile(), title = file.get('title');
			file.set('title', finalValue);
			file.set('path', file.get('path').replace(title, finalValue));
			file.commitRecord({ title: finalValue });
		},
		
		init: function() {
			sc_super();
			var query, projects;
			query = SC.Query.local(CloudcodeClient.File, "path = {project_path}", { project_path: "/" });
			projects = CloudcodeClient.store.find(query);
			var browser = SC.Object.create({
				treeItemIsExpanded: YES,
				treeItemChildren: projects
			});
			this.set('projects', projects);
		  this.set('content', browser);
	  	return YES;
		}	
});