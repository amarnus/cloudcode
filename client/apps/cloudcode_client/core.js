CloudcodeClient = SC.Application.create({
  NAMESPACE: 'CloudcodeClient',
  VERSION: '0.3.0',
  SERVER_URL: 'http://localhost:8080',
  ALLOWED_FILE_TYPES: [
  	{ name: 'HTML', extension: 'html', type: 'text/html', codemirror: 'htmlmixed' },
  	{ name: 'CSS', extension: 'css', type: 'text/css', codemirror: 'css' },
  	{ name: 'Javascript', extension: 'js', type: 'application/javascript', codemirror: 'javascript' },
  	{ name: 'JSON', extension: 'json', type: 'application/json', codemirror: 'javascript' },
  	{ name: 'XML', extension: 'xml', type: 'text/xml', codemirror: 'xml' },
  	{ name: 'Folder', extension: '', type: 'text/plain', codemirror: 'plain' },
  	{ name: 'Text', extension: 'txt', type: 'text/plain', codemirror: 'plain' }
  ],
  store: SC.Store.create().from('CloudcodeClient.DataSource'),
  getCodeMirrorModeFromMIMEType: function(mimeType) {
  	var i = 0;
  	for(; i < this.ALLOWED_FILE_TYPES.length; i++) {
  	  if (this.ALLOWED_FILE_TYPES[i].type == mimeType) {
  	  	return this.ALLOWED_FILE_TYPES[i].codemirror;
  	  }
    }
  }
});

// TODO:
// (1) Errors reported by the server need to be pushed
// by the app UI. eg. file with the same name in the same path
// (2) SourceListView for FileBrowser
// (4) TreeItemCollapsed + Expanded should retrieve from in-app
// memory and not again from the server
// (5) Keyboard shortcuts in the file editor
// (6) App Deploy in the server
// (9) Landing page for the app that allows user to connect to
// the Cloudcode server, Dropbox and other services
// (11) Syncing in-memory with server after a few seconds

// Switching revisions
// Changing live application version
// Offline storage / State
// Project search
// Javascript Minification
// Drag drop
// Rename (Important)


// Despite the apparent lack of focus, everything I talk about
// is directly or indirectly contributing to the cause of coding in 
// the cloud