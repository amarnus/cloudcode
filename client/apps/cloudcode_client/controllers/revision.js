sc_require('core');
sc_require('models/user');
sc_require('models/project');
sc_require('models/file');
sc_require('models/revision');
sc_require('data_sources/store');

CloudcodeClient.revisionController = SC.ArrayController.create({
	
	init: function() {
		sc_super();
	},
	
	selection: null,
	
	getCurrentRevision: function() {
		return this.get('selection').nextObject(0, null, {});
	},
	
	openRevision: function() {
		var revision = this.getCurrentRevision();
		if (revision) {
			var content1 = revision.get('content');
			var file = CloudcodeClient.store.find(CloudcodeClient.File, '/file/' + revision.get('fid'));
			var content2 = file.get('revision').get('content');
			var dmp = new diff_match_patch();
			var d = dmp.diff_main(content1, content2);
      var html = [], colors = [];
      var lineCount = 0;
      var line = 1, startLine = 1, endLine = 1;
      var ch = 1, startCh = 1, endCh = 1;
      for(var i = 0; i < d.length; i++) {
      	op = d[i][0];
      	data = d[i][1];
      	text = 
      		data.replace(/&/g, "&amp;")
      		.replace(/</g, "&lt;")
      		.replace(/>/g, "&rt;");
      	startCh = ch;
      	startLine = lineCount; 
      	switch(op) {
      		case DIFF_INSERT:
      			break;
      		
      		case DIFF_DELETE:
      			break;
      			
      		case DIFF_EQUAL:
      			break;
      	}
      	endCh = ch + data.length;
      	newLines = data.split("\n");
      	if (newLines && newLines.length > 1) {
      		endLine = lineCount + newLines.length;
      	}
      	else {
      		endLine = lineCount;
      	}
      	html.push(text);
      	colors.push({ s: { line: startLine, ch: startCh }, e: { line: endLine, ch: endCh }, t: op });
      	ch = endCh;
      	lineCount = endLine;
      }
      console.log(colors);
      CloudcodeClient.editorController.get('_editor').setValue(html.join(''));
      for(var j = 0; j < colors.length; j++) {
      	cssClass = (colors[j].t == -1) ? 'editorDeleteText' : 'editorInsertText';
      	console.log(JSON.stringify(colors[j].s));
      	console.log(JSON.stringify(colors[j].e));
      	CloudcodeClient.editorController.get('_editor').markText(colors[j].s, colors[j].e, cssClass);
      }
		}
	}
	
});