sc_require('core');
sc_require('models/file');
sc_require('models/project');
sc_require('models/user');
sc_require('lib/cloudcode');
sc_require('data_sources/browser.js');

window._convertToPlainText = function(text) {
	var node = document.createElement("textarea");
	node.innerHTML = text;
	return node.value;
};

CloudcodeClient.DataSource = SC.DataSource.extend({
	
	// Called when the projects have been fetched from the server
	_onProjectsFetch: function(response, store, query) {
		var projects = JSON.parse(response);
		var modifiedProjects = [];
		var project = null, guid = null, author = null, root = null, keys = [];
		for(var i = 0; i < projects.length; i++) {
			project = projects[i];
			project['guid'] = '/project/' + project['pid'];
			user = project['user'];
			user['guid'] = '/user/' + user['user_id'];
			keys = store.loadRecords(CloudcodeClient.User, [ user ]);
			project['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			root = project['root'];
			root['guid'] = '/file/' + root['fid'];
			root['path'] = escape(root['path']);
			root['parent'] = null;
			root['user'] = project['user'];
			revision = root['revision'];
			revision['guid'] = "/revision/" + revision['vid'];
			revision['content'] = window._convertToPlainText(revision['content']);
			revision['created'] = new Date(revision['created']).getTime();
			keys = store.loadRecords(CloudcodeClient.Revision, [ revision ]);
			root['revision'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			delete root['children'];
			keys = store.loadRecords(CloudcodeClient.File, [ root ]);
			project['root'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			modifiedProjects.push(project);
		}
		keys = store.loadRecords(CloudcodeClient.Project, modifiedProjects);
		store.dataSourceDidFetchQuery(query);
		SC.RunLoop.end();
	},
	
	// Called when all revisions have been fetched
	_onRevisionsFetch: function(response, fid, store, query) {
		var revisions = JSON.parse(response), revision, user;
		for(var i = 0; i < revisions.length; i++) {
			revision = revisions[i];
			revision['guid'] = "/revision/" + revision['vid'];
			revision['fid'] = fid;
			revision['content'] = window._convertToPlainText(revision['content']);
			user = revision['user'];
			user['guid'] = "/user/" + user['user_id'];
			keys = store.loadRecords(CloudcodeClient.User, [ user ]);
			revision['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
	  	revision['created'] = new Date(revision['created']).getTime();
	  	console.log(revision['created']);
		}
		store.loadRecords(CloudcodeClient.Revision, revisions);
		store.dataSourceDidFetchQuery(query);
		SC.RunLoop.end();
	},
	
	// Called when the files have been fetched from the server
	_onFilesFetch: function(response, pid, parent, store, query) {
		var files = JSON.parse(response), file = null, keys = [], children = [];
		for(var i = 0; i < files.length; i++) {
			file = files[i];
			file['guid'] = "/file/" + file['fid'];
			file['path'] = escape(file['path']);
			file['parent'] = parent.get('guid');
			user = file['user'];
			user['guid'] = '/user/' + user['user_id'];
			keys = store.loadRecords(CloudcodeClient.User, [ user ]);
			file['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			revision = file['revision'];
			revision['guid'] = "/revision/" + revision['vid'];
			revision['content'] = window._convertToPlainText(revision['content']);
			user = revision['user'];
			user['guid'] = '/user/' + user['user_id'];
			keys = store.loadRecords(CloudcodeClient.User, [ user ]);
			revision['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			revision['created'] = new Date(revision['created']).getTime();
			keys = store.loadRecords(CloudcodeClient.Revision, [ revision ]);
			file['revision'] = CloudcodeClient.store.idFor(keys.objectAt(0));
			delete file['children'];
			keys = store.loadRecords(CloudcodeClient.File, [ file ]);
			file_id = CloudcodeClient.store.idFor(keys.objectAt(0));
			children.pushObject(CloudcodeClient.store.find(CloudcodeClient.File, file_id));
		}
		parent.set('children', children);
		store.dataSourceDidFetchQuery(query);
		SC.RunLoop.end();
	},
	
	// Called when a new file or directory has been created at the server
  _onFileCreate: function(response, params, storeKey, store) {
    var file = JSON.parse(response), fid;
    fid = params.data['fid'] = file['fid'];
    params.data['path'] = escape(file['path']);
    params.data['parent'] = params.parent.get('id');
    revision = file['revision'];
    revision['guid'] = "/revision/" + revision['vid'];
    revision['content'] = window._convertToPlainText(revision['content']);
		user = revision['user'];
		user['guid'] = '/user/' + user['user_id'];
		keys = store.loadRecords(CloudcodeClient.User, [ user ]);
		revision['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
    revision['created'] = new Date(revision['created']).getTime();
		keys = store.loadRecords(CloudcodeClient.Revision, [ revision ]);
		params.data['revision'] = CloudcodeClient.store.idFor(keys.objectAt(0));
    store.dataSourceDidComplete(storeKey, params.data, "/file/" + fid);
  	file = store.find(CloudcodeClient.File, "/file/" + fid);
	  children = params.parent.get('children');
	  children.pushObject(file);
	  params.parent.set('children', children);
	  SC.RunLoop.end();
  },
  
  // Called when a new project has been created at the server
  _onProjectCreate: function(response, data, storeKey, store) {
  	var project = JSON.parse(response);
  	root = project['root'];
		root['guid'] = '/file/' + root['fid'];
		root['path'] = escape(root['path']);
		root['parent'] = null;
		revision = root['revision'];
		revision['guid'] = "/revision/" + revision['vid'];
		revision['content'] = window._convertToPlainText(revision['content']);
		user = revision['user'];
		user['guid'] = '/user/' + user['user_id'];
		keys = store.loadRecords(CloudcodeClient.User, [ user ]);
		revision['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
		revision['created'] = new Date(revision['created']).getTime();
		keys = store.loadRecords(CloudcodeClient.Revision, [ revision ]);
		root['revision'] = CloudcodeClient.store.idFor(keys.objectAt(0));
		delete root['children'];
		keys = store.loadRecords(CloudcodeClient.File, [ root ]);
		data['root'] = CloudcodeClient.store.idFor(keys.objectAt(0));
		store.dataSourceDidComplete(storeKey, data, "/project/" + project['pid']);
		SC.RunLoop.end();
  },
	
  _onRevisionCreate: function(response, params, storeKey, store) {
  	var revision = JSON.parse(response);
  	vid = revision.vid;
  	params['data']['fid'] = revision.fid;
  	params['data']['pvid'] = revision.pvid;
  	params['data']['vid'] = vid;
  	params['data']['title'] = revision.title;
		user = revision['user'];
		user['guid'] = '/user/' + user['user_id'];
		keys = store.loadRecords(CloudcodeClient.User, [ user ]);
		params['data']['user'] = CloudcodeClient.store.idFor(keys.objectAt(0));
  	params['data']['created'] = new Date(revision.created).getTime();
  	store.dataSourceDidComplete(storeKey, params['data'], "/revision/" + vid);
  	revision = CloudcodeClient.store.find(CloudcodeClient.Revision, "/revision/" + vid);
  	params['file'].set('revision', revision);
  	SC.RunLoop.end();
  },
  
  fetch: function(store, query) {
  	//var browserStore = CloudcodeClient.BrowserStore.create();
  	//var data = browserStore.fetch();
  	//console.log(data);
  	var recordType, cloudcodeApi = new CloudcodeApi(), params, callback;
  	recordType = query.get("recordType");
  	params = query.get("parameters");
	  if ((recordType == CloudcodeClient.File) && ("parent" in params)) {
		  callback = this._onFilesFetch;
	  	cloudcodeApi.getFiles({ pid: params["parent"].get("pid"), fid: params["parent"].get("fid") }, function(response, xhr) { 
	  		if (xhr.status == 200) {
		  	  callback(response, params["parent"].get("pid"), params["parent"], store, query); 
	  		}
	  		else {
	  			console.error(response);
	  			store.dataSourceDidErrorQuery(query, response);
	  		}
		  });
		  return YES;
	  }
	  else if ((recordType == CloudcodeClient.File) && ("project_path" in params)) {
	  	callback = this._onProjectsFetch;
	  	cloudcodeApi.getProjects(false, function(response, xhr) { 
	  		if (xhr.status == 200) {
	  		  callback(response, store, query);
	  		}
	  		else {
	  			console.error(response);
	  			store.dataSourceDidErrorQuery(query, response);
	  		}
	  	});
	  	return YES; 
	  }
	  else if ((recordType == CloudcodeClient.Revision) && ("fid" in params)) {
	  	callback = this._onRevisionsFetch;
	  	cloudcodeApi.getRevisions({ fid: params["fid"] }, function(response, xhr) {
	  		if (xhr.status == 200) {
	  			callback(response, params["fid"], store, query);
	  		} 
	  		else {
	  			console.error(response);
	  			store.dataSourceDidErrorQuery(query, response);
	  		}
	  	});
	  	
	  	
	  }
	  return NO;
  },

  createRecord: function(store, storeKey, params) {
  	var recordType, cloudcodeApi = new CloudcodeApi(), callback, data, files;
  	recordType = store.recordTypeFor(storeKey);
    if (recordType == "CloudcodeClient.Project") {
    	callback = this._onProjectCreate;
    	cloudcodeApi.createProject(params['data'], function(response, xhr) {
    		if (xhr.status == 200) {
    			callback(response, params, storeKey, store);
    		}
    		else {
    			store.dataSourceDidError(storeKey, response);
    		}
    	});
    	return YES;
    }
    else if (recordType == "CloudcodeClient.File") {
    	callback = this._onFileCreate;
    	var path = params['parent'].get('path') + params['data']['title'], query;
    	query = SC.Query.local(CloudcodeClient.File, 'path = {path} AND pid = {pid}', { path: path, pid: params['parent'].get('pid') });
    	files = store.find(query);
    	if (files) {
    		if (files.get('length') > 0) {
    			var response = 'Another file exists at the same path %@. You can try creating the file again with another name or delete/rename the existing file'.fmt(path);
    			SC.AlertPane.error('Action Incomplete', response, null, 'Close');
    		  return NO;
    		}
    	}
    	cloudcodeApi.createFile(params['data'], function(response, xhr) {
	    	if (xhr.status == 200) {
	    		callback(response, params, storeKey, store);
	    	}
	    	else {
	    		store.dataSourceDidError(storeKey, response);
	    		SC.AlertPane.error('Action Incomplete', response, null, "Close");
	    	}
	    });
    	return YES;
    }
    else if (recordType == "CloudcodeClient.Revision") {
    	callback = this._onRevisionCreate;
    	data = params['data'];
    	cloudcodeApi.createRevision({ fid: params['file'].get('fid'), title: data['title'] }, function(response, xhr) {
    		if (xhr.status == 200) {
    			callback(response, params, storeKey, store);
    		}
    		else {
    			store.dataSourceDidError(storeKey, response);
    		}
    	}, data['content']);
    	return YES;
    }
    
    return NO;
  },
  
  retrieveRecord: function(store, storeKey, id) {
  	console.log("Retrieving something from somewhere");
    return NO; 
  },
  
  updateRecord: function(store, storeKey, params) {
  	var recordType, data, args = {}, cloudcodeApi = new CloudcodeApi();
  	recordType = store.recordTypeFor(storeKey);
    data = store.readDataHash(storeKey);
    
    if (recordType == "CloudcodeClient.File") {
    	if ('title' in params) {
    		args['title'] = params['title'];
    	}
    	args['fid'] = data['fid'];
    	if ('tfid' in params) {
    		args['tfid'] = params['tfid'];
    	}
    	if (args['tfid'] || args['title']) {
    		cloudcodeApi.updateFile(args, function(response, xhr) {
    			if (xhr.status_code == 200) {
    				store.dataSourceDidComplete(storeKey);
    			}
    		});
    	}
      return YES;
    }
    
    return NO; 
  },
  
  destroyRecord: function(store, storeKey, params) {
  	var recordType, cloudcodeApi = new CloudcodeApi(), parent, children;
  	recordType = store.recordTypeFor(storeKey);
    if (recordType == "CloudcodeClient.File") {
    	parent = params.file.get('parent');
    	path = params.file.get('path');
    	fid = params.file.get('fid');
    	pid = params.file.get('pid');
    	if (parent === null) {
    		cloudcodeApi.removeProject({ pid: pid }, function(response, xhr) {
    			if (xhr.status == 200) {
    				store.dataSourceDidDestroy(storeKey);
    			}
    			else {
    				store.dataSourceDidError(storeKey, response);
    			}
    		});
    		return YES;
    	}
      children = parent.get('children');
      children = children.filter(function(item, index, enumerable) {
      	return (item.get('path') != path);
      }, children);
      parent.set('children', children);
      cloudcodeApi.removeFile({ fid: fid }, function(response, xhr) {
      	if (xhr.status == 200) {
      		store.dataSourceDidDestroy(storeKey);
      	}
      	else {
      		store.dataSourceDidError(storeKey, response);
      	}    	
      });
      return YES;
    }
    return NO;
  }
}) ;