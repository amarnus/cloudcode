import cgi
import urllib
import uuid
import hashlib
import logging

from google.appengine.api import channel
from google.appengine.api import memcache
from google.appengine.api import urlfetch
from google.appengine.api import channel
from google.appengine.api import oauth
from google.appengine.api import users
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from urlparse import urlparse
from django.utils import simplejson as json

''' Get the url string as an array of its parts '''
def get_url_parts(url):
	parsed = urlparse(url)
	parts = parsed.path.split("/")
	return filter(lambda part: len(part) > 0, parts)

''' Gets a unique number as a string '''
def get_unique_number():
	return str(uuid.uuid4())

''' Converts any object to a dictionary - Idea is to put all attributes as (key, value) tuples in a list and then cast the list as a dictionary '''
def to_dict(object=None):
	if object is not None and callable(object.properties):
		return dict([(property, unicode(getattr(object, property))) for property in object.properties()])
	else:
		return None

''' Gets an entity or a list of entities from a given model '''
def get_by_key_name(model, key):
	if type(key).__name__ == "list":
		if len(key) == 0:
			return []
	entity = model.get_by_key_name(key)
	if not entity:
		raise Error("A %s with key %s was not found" % (model.__name__, key), 400)
	return entity

''' Creates a File entity given a set of parameters. To be deprecated soon. Functionality to be added to put method of the File model '''
def create_file_entity(title, path, type, is_directory, content, project, user, father=None):
	fid = get_unique_number()
	vid = get_unique_number()
	file = File(key_name=fid, fid=fid, title=title, type=type, path=path, is_directory=is_directory, pid=project.pid, vid=vid, user=user, father=(father.fid if father else None))
	revision = Revision(key_name=vid, fid=file.fid, vid=vid, user=user, title=title, pvid=project.vid, content=content)
	revision.put()
	file.put()
	return file

class Error(Exception):
	message = None,
	code = None,
	def __init__(self, message, code=500):
		logging.error(self.message)
		self.message = message
		self.code = code
		
class CloudcodeModel(db.Model):
	def to_dict(self):
		return to_dict(self)

class Project(CloudcodeModel):
	pid = db.StringProperty()
	title = db.StringProperty()
	description = db.StringProperty(multiline=True),
	user = db.UserProperty()
	root = db.StringProperty()
	vid = db.StringProperty()
	template_pid = db.StringProperty()
	updated = db.DateTimeProperty(auto_now_add=True, auto_now=True)
	created = db.DateTimeProperty(auto_now_add=True)
	
	def to_dict(self):
		project = super(Project, self).to_dict()
		root = get_by_key_name(File, project["root"])
		project["root"] = root.to_dict()
		project["user"] = {
		  "user_id": self.user.user_id(),
		  "nickname": self.user.nickname(),
		  "email": self.user.email()
		}
		return project
	
class File(CloudcodeModel):
	fid = db.StringProperty()
	title = db.StringProperty()
	type = db.StringProperty()
	path = db.StringProperty()
	is_directory = db.IntegerProperty()
	vid = db.StringProperty()
	user = db.UserProperty()
	pid = db.StringProperty()
	father = db.StringProperty()
	children = db.StringListProperty()
	updated = db.DateTimeProperty(auto_now_add=True, auto_now=True)
	created = db.DateTimeProperty(auto_now_add=True)
	
	''' Constructs a duplicate of the given file record, puts it in the Datastore and then returns it '''	
	def duplicate(self, project):
		copy = create_file_entity(self.title, self.path, self.type, self.is_directory, "", project, project.user)
		children = []
		if self.children and len(self.children) > 0:
			for child in get_by_key_name(File, self.children):
				if child:
					temp = child.duplicate(project)
					temp.father = copy.fid 
					temp.put()
					children.append(temp.fid)
		copy.children = children
		copy.put()
		revision = Revision.get_by_key_name(self.vid)
		content = revision.content
		revision = Revision.get_by_key_name(copy.vid)
		revision.content = content
		revision.put()
		return copy
	
	def to_dict(self):
		file = super(File, self).to_dict()
		revision = get_by_key_name(Revision, self.vid)
		file["revision"] = revision.to_dict()
		file["user"] = {
		  "user_id": self.user.user_id(),
		  "nickname": self.user.nickname(),
		  "email": self.user.email()
		}
		return file
	
	def delete(self):
		revisions = Revision.gql("WHERE fid=:fid", fid=self.fid)
		for revision in revisions:
			revision.delete()
		files = get_by_key_name(File, self.children)
		for file in files:
			file.delete() if file else None
		if self.father:
			father = get_by_key_name(File, self.father)
			father.children.remove(self.fid) # Remove file as a child of parent
		super(File, self).delete()
	
class Revision(CloudcodeModel):
	fid = db.StringProperty()
	vid = db.StringProperty()
	user = db.UserProperty()
	title = db.StringProperty()
	content = db.TextProperty()
	pvid = db.StringProperty()
	log = db.StringProperty()
	created = db.DateTimeProperty(auto_now_add=True)
	
	def to_dict(self):
		revision = super(Revision, self).to_dict()
		revision["user"] = {
		  "user_id": self.user.user_id(),
		  "nickname": self.user.nickname(),
		  "email": self.user.email()
		}
		return revision
	
class Permission(CloudcodeModel):
	fid = db.StringProperty()
	user = db.UserProperty()
	permission = db.IntegerProperty()
	
class Message(CloudcodeModel):
	user = db.UserProperty()
	fid = db.StringProperty()
	text = db.StringProperty(multiline=True)
	timestamp = db.DateTimeProperty(auto_now_add=True)
	
class Version(CloudcodeModel):
	pid = db.StringProperty()
	vid = db.StringProperty()
	created = db.DateTimeProperty(auto_now_add=True)

class User(CloudcodeModel):
	user_id = db.StringProperty()
	user = db.UserProperty()
	joined = db.DateTimeProperty(auto_now_add=True)
	
	def to_dict(self):
		return {
		  "user_id": self.user_id,
		  "email": self.user.email(),
		  "nickname": self.user.nickname(),
		  "joined": str(self.joined)
		}
	
class InstallHandler(webapp.RequestHandler):
	def get(self):
		user = users.get_current_user()
		found = User.get_by_key_name(user.user_id())
		if not found:
			account = User(key_name=user.user_id(), user_id=user.user_id(), user=user)
			account.put()

class MainHandler(webapp.RequestHandler):
	def get(self):
		self.response.out.write("<span style='font-family:monospace;'>Hello World</span>")

class SandboxHandler(webapp.RequestHandler):
	files = [],
	
	''' Check if the project path in the URL is valid '''
	def check_path(self):
		file = File.gql("WHERE pid=:1 AND path=:2", self.pid, self.path)
		if file is None:
			raise Error("That path %s was not found in this project" % (self.path), 404)
		revisions = Revision.gql("WHERE fid=:1 AND pvid=:2 ORDER BY created DESC", file.fid, self.vid)
		if not revisions:
			raise Error("Version %s does not exist for the file at %s" % (self.vid, self.path), 404)
		else:
			file.revision = revisions.get() # Just get the latest one
		return file
	
	''' Check if the required arguments inside the URL are valid '''
	def check_args(self):
		get_by_key_name(Project, self.pid)
		# Defer judgement on the validity of the version ID
		# until later
			
	def get(self):
		self.parts = get_url_parts(self.request.url)
		if len(self.parts) < 3:
			self.error(404)
		elif len(self.parts) == 3:
			self.path = "/"
		else:
			self.path = "/".join(self.parts[3:])
		self.pid = self.parts[1]
		self.vid = self.parts[2]
		try:
			self.check_args()
			file = self.check_path()
			user = users.get_current_user()
			if not user:
				self.redirect(users.create_login_url(self.request.url))
			elif user != file.user:
				self.error(403)
			else:
				self.response.headers['Content-Type'] = file.type
				self.response.out.write(file.revision.content)
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)
		
		
class LiveHandler(webapp.RequestHandler):
	revision_map = {},
	''' Find out the suitable revision of the file '''
	def check_path(self):
		path = self.path
		# For any directory check if there is an index.html file inside
		file = File.gql("WHERE pid=:1 AND path=:2", self.pid, self.path).get()
		if not file:
			raise Error("", 404)
		if file.is_directory:
			results = File.gql("WHERE path=:1", file.path + "index.html")
			if results.count():
				file = results.get()
			else:
				raise Error("", 403)
		# There could be a bunch of revisions that this file has
		# stamped with the same project version
		revisions = Revision.gql("WHERE fid=:1 AND pvid=:2 ORDER BY created DESC", file.fid, self.vid)
		if not revisions:
			raise Error("", 500)
		else:
			file.revision = revisions.get() # Just get the latest one
			return file
		
	''' Check if the project exists '''
	def check_args(self):
		pid = self.pid
		project = get_by_key_name(Project, pid)	
		self.vid = project.vid
	
	def get(self):
		self.parts = get_url_parts(self.request.url)
		if len(self.parts) < 2:
			self.error(404)
		elif len(self.parts) == 2:
			self.path = "/"
		else:
			self.path = "/" + "/".join(self.parts[2:])
			if self.request.url[-1] == "/":
				self.path += "/"
		self.pid = self.parts[1]
		try:
			self.check_args()
			file = self.check_path()
			self.response.headers.add_header('Content-Type', file.type)
			self.response.out.write(file.revision.content)
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)

class PlatformHandler(webapp.RequestHandler):
	parts = None, 
	path = None,
	
	''' Removes unnecessary slashes from the path if any '''
	def resolve_path(self):
		self.parts = get_url_parts(self.request.url)
		self.path = "/".join(self.parts).rstrip()
		
	''' Check if required parameters were passed with the request '''
	def check_args(self, required):
		args = self.request.arguments()
		if required is None or len(required) == 0:
			return True
		else:
			required = filter(lambda arg: arg not in args and arg is None, required)
			if len(required) > 0:
				raise Error("The following required parameters were missing: " + str(required), 400)
				
	def get(self):
		self.resolve_path()
		try:
			user = oauth.get_current_user()
			if self.path == "api/projects":
				projects = Project.gql("WHERE user=:1", user)
				projects = map(lambda project: project.to_dict(), projects)
				self.response.out.write(json.dumps(projects))
			elif self.path == "api/users":
				users = User.all()
				users = map(lambda user: user.to_dict(), users)
				self.response.out.write(json.dumps(users))
			elif self.path == "api/project":
				self.check_args([ "pid" ])
				pid = self.request.get("pid")
				project = get_by_key_name(Project, pid)
				project = project.to_dict()
				self.response.out.write(json.dumps(project))
			elif self.path == "api/file":
				self.check_args([ "fid" ])
				fid = self.request.get("fid")
				file = get_by_key_name(File, fid)
				file = file.to_dict()
				self.response.out.write(json.dumps(file))
			elif self.path == "api/files":
				self.check_args([ "fid" ])
				fid = self.request.get("fid")
				parent = get_by_key_name(File, fid)
				files = get_by_key_name(File, parent.children)
				output = []
				for file in files:
					if file:
						output.append(file.to_dict())
				self.response.out.write(json.dumps(output))
			elif self.path == "api/revisions":
				self.check_args([ "fid" ])
				fid = cgi.escape(self.request.get("fid"))
				output = []
				revisions = Revision.gql("WHERE fid=:1 ORDER BY created DESC", fid)
				for revision in revisions:
					if revision:
						output.append(revision.to_dict())
				self.response.out.write(json.dumps(output))
			elif self.path == "api/versions":
				self.check_args([ "pid" ])
				pid = cgi.escape(self.request.get("pid"))
				output = []
				versions = Version.gql("WHERE pid=:1 ORDER BY created DESC", pid)
				for version in versions:
					if version:
						output.append(version.to_dict())
				self.response.out.write(json.dumps(output))
			elif self.path == "api/account":
				user = {
				  "user_id": user.user_id(),
				  "nickname": user.nickname(),
				  "email": user.email()
				}	
				self.response.out.write(json.dumps(user))
			else:
				self.error(404)
		except oauth.OAuthRequestError, e:
			self.response.set_status(403)
			self.response.out.write(e.message)		
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)
				
	def post(self):
		self.resolve_path()
		try:
			user = oauth.get_current_user()
			if self.path == "api/projects":
				self.check_args([ "title" ])
				title = cgi.escape(self.request.get("title"))
				description = cgi.escape(self.request.body)
				template_pid = cgi.escape(self.request.get("template_pid"))
				pid = get_unique_number()
				vid = get_unique_number()
				user = oauth.get_current_user()
				project = Project(key_name=pid, pid=pid, title=title, user=user, description=self.request.body, vid=vid, template_from=None)
				if template_pid:
					template = get_by_key_name(Project, template_pid)
					source = get_by_key_name(File, template.root)
					root = source.duplicate(project)
					root.title = title
					root.put()
					project.template_pid = template_pid
				else:
					root = create_file_entity(title, "/", "text/plain", 1, "", project, user)
				project.root = root.fid
				project.put()
				self.response.out.write(json.dumps(project.to_dict()))
			elif self.path == "api/versions":
				self.check_args([ "pid" ])
				pid = cgi.escape(self.request.get('pid'))
				vid = cgi.escape(self.request.get('vid'))
				# If vid has been specified, we just need to make the version the current app version
				if vid:
					version = get_by_key_name(Version, vid) # Just to check if the version exists
					project = get_by_key_name(Project, pid)
					project.vid = version.vid
					project.put() # Save update
				else:
					# Create new version
					vid = get_unique_number()
					Version(key_name=vid, vid=vid, pid=pid).put()
				self.response.out(json.dumps({ 'vid': vid }))
			else:
				self.error(404)
		except oauth.OAuthRequestError, e:
			self.response.set_status(403)
			self.response.out.write(e.message)
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)
				
	def put(self):
		self.resolve_path()
		try:
			user = oauth.get_current_user()
			if self.path == "api/files":
				self.check_args([ "fid", "title", "type", "is_directory", "pid" ])
				fid = self.request.get("fid")
				title = self.request.get("title")
				type = self.request.get("type")
				pid = self.request.get("pid")
				is_directory = int(self.request.get("is_directory"))
				project = get_by_key_name(Project, pid)
				parent = get_by_key_name(File, fid)
				content = self.request.body
				path = parent.path + self.request.get("title") + ("/" if is_directory else "")
				files = File.gql("WHERE path=:path AND pid=:pid", path=path, pid=pid)
				if files.count() > 0:
					raise Error("Another file exists at the path %s in the project %s already" % (path, project.title), 403)
				file = create_file_entity(title, path, type, is_directory, content, project, user, parent)
				if not parent.children:
					parent.children = [ file.fid ]
				else:
					parent.children.append(file.fid)
				parent.put()
				self.response.out.write(json.dumps(file.to_dict()))
			elif self.path == "api/file":
				self.check_args([ "fid" ])
				fid = cgi.escape(self.request.get("fid"))
				source = get_by_key_name(File, fid)
				title = cgi.escape(self.request.get("title"))
				if title and title != source.title:
					source.path = source.path.replace(source.title, title)
					source.title = title
					source.put()
					self.response.out.write(json.dumps(source.to_dict()))
				tfid = self.request.get("tfid") # Target file identifier
				if tfid:
					target = get_by_key_name(File, tfid)
					if target.fid == source.father:
						self.response.out.write(json.dumps(source.to_dict()))
					else:
						father = get_by_key_name(File, source.father)
						father.children = filter(lambda child: child != fid, father.children)
						father.put() # Remove child from father
						source.father = target.fid
						source.path = target.path + source.path
						source.put()
						target.children.append(source.fid)
						target.put()
						self.response.out.write(json.dumps(source.to_dict()))
						
			elif self.path == "api/revision":
				self.check_args([ "fid" ])
				fid = self.request.get("fid")
				title = self.request.get("title")
				content = self.request.body
				log = self.request.get("log")
				file = get_by_key_name(File, fid)
				vid = file.vid
				title = title if title else file.title
				revision = get_by_key_name(Revision, vid)
				if content:
					new_hash = hashlib.md5(content).hexdigest()
					revision = get_by_key_name(Revision, vid)
					old_hash = hashlib.md5(revision.content).hexdigest()
					if cmp(old_hash, new_hash) != 0:
						vid = get_unique_number()
						revision = Revision(key_name=vid, fid=file.fid, title=title, vid=vid, content=content, pvid=revision.pvid, log=log, user=user)
						revision.put()
						file.vid = vid
						file.put()
				self.response.out.write(json.dumps(revision.to_dict()))
			else:
				self.error(404)
		except oauth.OAuthRequestError, e:
			self.response.set_status(403)
			self.response.out.write(e.message)
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)	
		
	def delete(self):
		self.resolve_path()
		try:
			user = oauth.get_current_user()
			if self.path == "api/project":
				self.check_args([ "pid" ])
				pid = self.request.get("pid")
				project = get_by_key_name(Project, pid)
				file = get_by_key_name(File, project.root)
				file.delete()
				project.delete()
			elif self.path == "api/file":
				self.check_args([ "fid" ])
				fid = self.request.get("fid")
				file = get_by_key_name(File, fid)
				file.delete()
			else:
				self.error(404)
		except oauth.OAuthRequestError, e:
			self.response.set_status(403)
			self.response.out.write(e.message)
		except Error, e:
			self.response.set_status(e.code)
			self.response.out.write(e.message)						

class ConsoleHandler(webapp.RequestHandler):
	def get(self):
		base_url = "http://127.0.0.1:8080/"
		url = base_url + "api/projects"
		response = urlfetch.fetch(url=url, method=urlfetch.GET)
		print response.status_code
		print response.content
		title = "Cloudcode Demo 1"
		url = base_url + "api/projects?" + urllib.urlencode({"title": title})
		description = "Cloudcode First Demo Application"
		response = urlfetch.fetch(url=url, payload=description, method=urlfetch.POST)
		print response.status_code
		print response.content
		result = json.loads(response.content)
		pid = result["pid"]
		parent_fid = result["fid"]
		url = base_url + "api/files?" + urllib.urlencode({ "pid": pid, "title": "landing", "is_directory": 1, "fid": parent_fid, "type": "text/plain" })
		response = urlfetch.fetch(url=url, method=urlfetch.PUT)
		print response.status_code
		print response.content
		result = json.loads(response.content)
		fid = result["fid"]
		url = base_url + "api/files?" + urllib.urlencode({ "pid": pid, "title": "index.html", "is_directory": 0, "fid": fid, "type": "text/html" })
		response = urlfetch.fetch(url=url, payload="<a>Danny Morrison</a>", method=urlfetch.PUT)
		result = json.loads(response.content)
		fid = result["fid"]
		print response.status_code
		print response.content
		url = base_url + "api/projects?" + urllib.urlencode({ "title": "Copy", "template_pid": pid })
		response = urlfetch.fetch(url=url, payload="I am a deep copy", method=urlfetch.POST)
		print response.status_code
		print response.content
		result = json.loads(response.content)
		cpid = result["pid"]
		url = base_url + "api/revision?" + urllib.urlencode({ "fid": fid, "log": "Not many changes.." })
		response = urlfetch.fetch(url=url, payload="<a>Robin Jackman</a>", method=urlfetch.PUT)
		print response.status_code
		print response.content
		url = base_url + "api/project?" + urllib.urlencode({"pid": pid})
		response = urlfetch.fetch(url=url, method=urlfetch.GET)
		print response.status_code
		print response.content
		url = base_url + "api/files?" + urllib.urlencode({"fid": parent_fid})
		response = urlfetch.fetch(url=url, method=urlfetch.GET)
		print response.status_code
		print response.content
		url = base_url + "api/file?" + urllib.urlencode({"fid": fid})
		response = urlfetch.fetch(url=url, method=urlfetch.GET)
		print response.status_code
		print response.content
		url = base_url + "api/file?" + urllib.urlencode({"fid": fid})
		response = urlfetch.fetch(url=url, method=urlfetch.DELETE)
		print response.status_code
		print response.content
		url = base_url + "api/project?" + urllib.urlencode({"pid": pid})
		response = urlfetch.fetch(url=url, method=urlfetch.DELETE)
		print response.status_code
		print response.content
		url = base_url + "api/project?" + urllib.urlencode({"pid": cpid})
		response = urlfetch.fetch(url=url, method=urlfetch.DELETE)
		print response.status_code
		print response.content

def main():
	application = webapp.WSGIApplication([
	  ("/", MainHandler),
	  ("/install", InstallHandler),
	  ("/api/.*", PlatformHandler),
	  ("/sandbox/.*", SandboxHandler),
	  ("/project/.*", LiveHandler),
	  ("/console/?", ConsoleHandler)
	], debug=True)
	util.run_wsgi_app(application)

if __name__ == "__main__":
	main()