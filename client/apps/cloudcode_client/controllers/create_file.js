sc_require('core');
sc_require('views/create_file');

CloudcodeClient.createFileFormController = SC.ObjectController.create({
	// The actual value of the form field
	title: null, 
	type: CloudcodeClient.ALLOWED_FILE_TYPES[0],
	parent: null,
	isDirectory: false,
	form: null,
	
	/**
	 * Destroys the state of the form. 
	 * 
	 * If this method is not invoked when the form is closed (either by
	 * closing it explicitly or on submit), then form will get restored from 
	 * its last state which might not always be the expected behavior
	 */
	_destroyValues: function() {
	   this.set('title', null);
	   this.set('isDirectory', null);
	   this.set('type', CloudcodeClient.ALLOWED_FILE_TYPES[0]);
	   this.set('parent', null);
	   this.get('form').remove();
   },
	
	/** 
	 * Creates the form and adds it to the display
	 * 
	 * @param {SC.Record} parent
	 *   Parent of the new folder getting created
	 */
	open: function(parent, isDirectory) {
		var selectField;
	  this.set('parent', parent);
	  this.set('isDirectory', isDirectory);
	  if (isDirectory) {
	  	
	  }
	  var form = CloudcodeClient.createFileFormPane;
	  form.append();
	  this.set('form', form);
	},
	
	/**
	 * Closes the form if it is open already
	 */
	close: function() {
	  this._destroyValues();
	},
	
	/**
	 * Called when the form is submitted
	 */
	create: function() {
		var title, type, isDirectory, parent, file, options;
	  title = this.get('title');
	  parent = this.get('parent');
	  isDirectory = this.get('isDirectory');
	  type = this.get('type');
	  if (parent && title) {
			var dataHash = {
			  title: title + (!isDirectory ? ".%@".fmt(type.extension) : ''),
			  pid: parent.get('pid'),
			  fid: parent.get('fid'),
			  is_directory: isDirectory ? 1 : 0,
			  type: type.type
			};
			file = CloudcodeClient.store.createRecord(CloudcodeClient.File, dataHash);
			options = {
				parent: parent,
				data: dataHash
			};
			CloudcodeClient.store.commitRecord(CloudcodeClient.File, file.get('id'), file.get('storeKey'), options);
			this.close();
	  }
	}
});