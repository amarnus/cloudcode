CloudcodeClient.File = SC.Record.extend({
  fid: SC.Record.attr(String),
  title: SC.Record.attr(String),
  type: SC.Record.attr(String),
  path: SC.Record.attr(String),
  pid: SC.Record.attr(String),
  is_directory: SC.Record.attr(Number, { default_value: 0 }),
  revision: SC.Record.toOne("CloudcodeClient.Revision"),
  user: SC.Record.toOne("CloudcodeClient.User"),
  parent: SC.Record.toOne("CloudcodeClient.File", { inverse: "children" }),
  children: SC.Record.toMany("CloudcodeClient.File", { inverse: "parent" }),
  updated: SC.Record.attr(String),
  created: SC.Record.attr(String),
  treeItemIsExpanded: NO,
  
  search: function(pattern) {
  	var isDirectory, children, child, found, newchildren = [];
  	title = this.get('title');
  	isDirectory = this.get('is_directory');
  	children = this.get('children');
  	if (children) {
  		var i = 0;
  		for (; i < children.get('length'); i++) {
  			child = children.objectAt(i);
  			found = child.search(pattern);
  			if (found) {
  				child.set('dontShow', false);
  			}
  			else {
  				child.set('dontShow', true);
  			}
  		}
  	}
  	exp = new RegExp(pattern);
  	parent = exp.test(title);
		// If at least one of the children or the folder itself matches
		// the pattern, then this folder has to show up
  	return parent || found;
  },
  
  // Computed properties
  childrenCount: function() {
	  return this.get('children').get('length');
  }.property(),
 
  icon: function() {
		var iconsFactory = {
		  folder: 'sc-icon-folder-16',
		  file: 'sc-icon-document-16'	
		};
		return (this.get('is_directory') == 1) ? iconsFactory.folder : iconsFactory.file; 
  }.property().cacheable(),

  treeItemChildren: function() {
	  if (this.get('is_directory')) {
	  	var i = 0, children = this.get('children'), output=[];
	  	for(; i < children.get('length'); i++) {
	  		child = children.objectAt(i);
	  		if (!child.get('dontShow')) {
	  			output.pushObject(child);
	  		}
	  	}
	  	return output;
	  }
	  else {
		  return null;
	  }
  }.property(),

  treeItemIsExpandedObserver: function() {
	  if (this.get('treeItemIsExpanded') == YES) {
		  var query = SC.Query.local(CloudcodeClient.File, 'fid = {fid}', { fid: this.get('fid'), parent: this });
		  CloudcodeClient.store.find(query);
	  }
	}.observes('treeItemIsExpanded')

});