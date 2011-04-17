sc_require('core');
sc_require('views/create_project');

CloudcodeClient.createProjectFormController = SC.ObjectController.create({
	title: null, 
	description: "",
	templateFrom: "",
	
	/**
	 * Additional meta information required by the form handler is contained here
	 */
	meta: {},
	
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
	   this.set('description', "");
	   this.set('meta', {});
	   this.set('templateFrom', "");
	   this.get('form').remove();
   },
	
	/** 
	 * Creates the form and adds it to the display
	 */
	open: function() {
	  var form = CloudcodeClient.createProjectFormPane;
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
	  var title = this.get('title');
	  var description = this.get('description');
	  var templateFrom = this.get('templateFrom');
	  if (title) {
			var dataHash = {
			  title: title,
			  description: description
			};
			if (templateFrom) {
			  dataHash["template_pid"] = templateFrom;
			}
			var record = CloudcodeClient.store.createRecord(CloudcodeClient.Project, dataHash);
			CloudcodeClient.store.commitRecord(CloudcodeClient.File, record.get('id'), record.get('storeKey'), { data: dataHash });
			this.close();
	  }
	}
});