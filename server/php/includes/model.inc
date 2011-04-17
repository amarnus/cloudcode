<?php 

require_once('exceptions.inc');

/**
 * Abstract class that acts as the base for all the models used in
 * Cloudcode. This includes File, Project, Revision etc.
 * 
 */
abstract class Model {
  abstract public static function all();
};

/**
 * Provides an interface to access the files stored in the Database
 */
class File extends Model {
  
  /**
   * Implements the abstract method of Model
   */
  public static function all() {
    global $mysql;
    $files = array();
    $results = $mysql->query("SELECT * FROM File");
    while($file = $results->fetch_object()) {
      $files[] = $file;
    }
    return $files;
  }
  
  /**
   * Gets a file by its unique file identifier
   * 
   * @param
   *   Unique identifier of the file
   * 
   * @throws
   *   FileNotFoundException when the file does not exist
   */
  public static function get_file_by_fid($fid = NULL) {
    global $mysql;
    if (!is_null($fid) && intval($fid) > 0) {
      $file = $mysql->query('SELECT * FROM file WHERE fid=%d', $fid)->fetch_object();
      if ($file) {
        return $file;
      }
    }
    throw new FileNotFoundException('The file with ID ' . $fid . ' could not be found', 404);
  }
  
  /**
   * Gets a file by its unique path in the project
   * 
   * @param $pid
   *   Unique project identifier
   * @param $path
   *   Location of the file within the project
   *   
   * @throws
   *   PathNotFoundException
   */
  public static function get_file_by_path($pid, $path = NULL) {
    global $mysql;
    if (!empty($path)) {
      $file = $mysql->query('SELECT * FROM file WHERE path="%s" AND pid=%d', $path, $pid)->fetch_object();
      if ($file) {
        return $file;
      }
    }
    throw new PathNotFoundException('The path ' . $path . ' could not be found', 404);
  }
  
  /**
   * Gets the direct children of a folder i.e. descendents not included
   * 
   * @param $pid
   *   Project identifier
   * @param $path
   *   Path to the parent
   * @param $uid
   *   User identifier of the user requesting access
   *   
   * TODO Access control
   */
  public static function get_children($pid, $path = NULL, $uid = NULL) {
    global $mysql;
    if (!$uid) {
      $uid = $GLOBALS['user']->uid;
    }
    $parent = File::get_file_by_path($pid, $path);
    if (!$parent->is_directory) {
      throw new NotDirectoryException('The path mentioned is not that of a directory and cannot have children', 400);
    }
    $result = $mysql->query("SELECT child_fid FROM hierarchy WHERE parent_fid=%d", $parent->fid); 
    $children = array();
    if (!$result) {
      return $children;
    }
    while ($child = $result->fetch_object()) {
      $children[] = File::get_file_by_fid($child->child_fid);
    }
    return $children;
  }
  
  /**
   * Adds a file to a parent (folder) in a project
   * 
   * @param $pid
   *   Project identifier  
   * @param $path
   *   Path to parent in the project
   * @param $options
   *   Meta information about the file being added (passed to File#create_file)
   * @param $uid
   *   User identifier of the user requesting to perform this action
   *   
   * @return
   *   Returns the file identifier of the newly created and added file
   */
  public static function create_child($pid, $path = NULL, $options = array(), $uid = NULL) {
    global $mysql;
    if (!$uid) {
      $uid = $GLOBALS['user']->uid;
    }
    $parent = File::get_file_by_path($pid, $path);
    if (!$parent->is_directory) {
      throw new NotDirectoryException('The path mentioned is not that of a directory and cannot have a child', 400);
    }
    $options['path'] = $parent->path . $options['title'] . ($options['is_directory'] ? '/' : ''); // Assuming every directory will have a trailing path..
    $options['permissions'] = 555;
    $child_fid = File::create_file($uid, $pid, $options, FALSE);
    $mysql->query('INSERT INTO hierarchy(parent_fid, child_fid) VALUES (%d, %d);', $parent->fid, $child_fid); 
    return $child_fid;
  }
  
  /**
   * Ensure the file extension is supported and identify the file header
   * for a file of this type
   * 
   * @param $options
   *   File options
   * @return
   *   Modified file options
   */
  private static function check_extension($options) {
    // Find out the extension and see if the corresponding file
    // type is allowed
    $parts = explode(".", $options['title']);
    // Name can have any number of dots.
    if (count($parts) == 1) {
      $options['type'] = 'text/plain';
    } 
    else if (count($parts) > 1) {
      $extension = trim(end($parts));
      global $cloudcode;
      $allowed = $cloudcode->ALLOWED_FILE_TYPES;
      if (!isset($allowed[$extension])) {
        throw new UnsupportedFileTypeException("The file type " . $extension . " is not supported", 400);
      }
      $options['ext'] = $extension;
      $options['type'] = $allowed[$extension];
    }
    return $options;
  }
  
  /**
   * Creates and inserts a new file
   * 
   * @param $uid
   *   Owner of the file
   * @param $pid
   *   Project identifier
   * @param $options
   *   An associative array containing meta information
   * @return 
   *   FALSE in case of an error or File identifier of the newly created file
   */
  public static function create_file($uid, $pid, $options = array(), $check_duplicate = TRUE) {
    global $mysql;
    if (!$uid || !$pid) {
      return FALSE;
    }
    $defaults = array(
      'title' => 'root',
      'is_directory' => 1,
      'path' => '/',
      'type' => 'text/plain',
      'ext' => '',
      'content' => '',
      'permissions' => 555,
      'updated' => time(),
      'created' => time()
    );
    $options = self::check_extension($options) + $defaults;
    $options['uid'] = $uid;
    $options['pid'] = $pid;
    try {
      $file = File::get_file_by_path($pid, $options['path']);
    } catch(PathNotFoundException $e) {
      // Silently ignore
    };
    if ($file) {
      $directory = dirname($file->path);
      throw new DuplicateFileExistsException("A file with the same name ($file->title) already exists in the same directory ($directory)", 400);
    }
    $result = $mysql->query("SELECT fid FROM file WHERE path='%s' AND title='%s' AND pid=%d AND is_directory=%d", $options['path'], $options['title'], $options['pid'], $options['is_directory']);
    $mysql->query(
      "INSERT INTO file(fid, title, is_directory, path, type, ext, content, uid, pid, permissions, updated, created) VALUES('', '%s', %d, '%s', '%s', '%s', '%s', %d, %d, %d, %d, %d)", 
      $options['title'], $options['is_directory'], $options['path'], $options['type'], $options['ext'], $options['content'], $options['uid'], $options['pid'], $options['permissions'], $options['updated'], $options['created']
    );
    return mysql_insert_id();
  }
  
  /**
   * Updates a file with new information including content
   * 
   * @param $options
   *   New set of file options
   */
  public static function update_file_by_fid($fid, $pid, $options, $uid) {
    $file = self::get_file_by_fid($fid);
    // Get the attribute-value mapping for the file
    $map = get_object_vars($file);
    $options = self::check_extension($options);
    $difference = array_diff_assoc($options, $map);
    if (!count($difference)) {
      // No change
      return;
    }
    else {
      $values = array();
      $query = array();
      foreach($difference as $attribute => $value) {
        $query[] = "$attribute='%s'";
        $values[$attribute] = $options[$attribute];
      }
      $query = implode(", ", $query);
      $params = array_merge(array("UPDATE file SET $query WHERE fid=%d"), array_values($values), array($fid));
      global $mysql;
      call_user_func_array(array(&$mysql, 'query'), $params);
    }
  }
  
  /**
   * Removes a file or directory with the given file identifier
   * 
   * @param $fid
   *   Unique file identifier of a file
   * @param $pid
   *   Project identifier of the project in which the file was found
   * @param $uid
   *   User identifier of the user requesting deletion
   */
  function remove_file_by_fid($fid, $pid, $uid) {
    // TODO Access control with project ID and user ID
    if (!empty($fid)) {
      if ($file = File::get_file_by_fid($fid)) {
        $GLOBALS['mysql']->query('DELETE f.*, h.* FROM file f, hierarchy h WHERE f.path LIKE "%s" AND (f.fid=h.child_fid OR f.fid=h.parent_fid)', $file->path . "%");
        return TRUE;
      }
    }
    throw new FileNotFoundException('The file to be deleted was not found', 404);
  }
  
};


/**
 * Provides an interface to the projects stored in the Database
 */
class Project extends Model {
  
  /**
   * Formats project information to be used as a response
   * 
   * @param $project
   *   Project array
   */
  private function format_project($project) {
    $format = 'r';
    return 
      array(
        'pid' => $project['pid'],
        'title' => $project['title'],
        'description' => $project['description'],
        'updated' => date($format, $project['project_updated']), // RFC2822
        'created' => date($format, $project['project_created']),
        'author' => array(
          'uid' => $project['uid'],
          'email' => $project['email'],
          'created' => date($format, $project['user_created'])
        ),
        'root' => array(
          'fid' => $project['fid'],
          'title' => $project['title'],
          'type' => $project['type'],
          'ext' => $project['ext'],
          'path' => $project['path'],
          'content' => $project['content'],
          'is_directory' => $project['is_directory'],
          'permissions' => $project['permissions'],
          'created' => date($format, $project['file_created']),
          'updated' => date($format, $project['file_updated'])
        )
      );
  }
  
  /**
   * Implements Model#all() from the abstract base class that this class inherits from
   */
  public static function all() {
    $projects = array();
    $result = $GLOBALS['mysql']->query(self::get_all_query());
    while($row = $result->fetch_array()) {
      $projects[] = self::format_project($row);
    }
    return $projects;
  }
  
  /**
   * Gets the static query to retrieve all the projects created
   */
  private static function get_all_query() {
    $query = 
      'SELECT p.*, p.created AS project_created, p.updated AS project_updated, u.*, u.created AS user_created, f.*, f.created AS file_created, f.updated AS file_updated
       FROM project p, user u, file f
       WHERE p.uid = u.uid AND p.pid = f.pid AND f.fid=p.root_id';
    return $query;
  }
  
  /**
   * Gets project by its identifier
   * 
   * @param $pid
   *   Project identifier
   * @param $owner_uid
   *   User identifier of the user who owns the project
   * @param $requester_uid
   *   User identifier of the user requesting for this project
   */
  public static function get_project_by_pid($pid, $owner_uid, $requester_uid = NULL) {
    // TODO Access control
    global $mysql;
    $result = $mysql->query(self::get_all_query() . " AND p.pid=%d", $pid);
    if (!$result->count) {
      throw new ProjectNotFoundException('The project could not be found', 404);
    }
    return self::format_project($result->fetch_array());
  }
  
  /**
   * Gets project by its title
   * 
   * @param $title
   *   Title of the project 
   * @param $owner_uid
   *   User identifier of the user who owns the project
   * @param $requester_uid
   *   User identifier of the user requesting for this project
   */
  public static function get_project_by_title($title, $owner_uid, $requester_uid = NULL) {
    // TODO Access control
    global $mysql;
    $result = $mysql->query(self::get_all_query() . " AND LOWER(p.title)=LOWER('%s') AND p.uid=%d", $title, $owner_uid);
    if ($result->fetch_object()) {
      return self::format_project($result->fetch_array());
    }
    return FALSE;
  }
  
  /**
   * Creates and inserts a new project
   * 
   * @param $title
   *   Title of the new project to be created
   * @param $description
   *   Short description of the new project
   * @param $uid
   *   User identifier of the user attempting to create the project
   */
  public static function create_project($title, $description, $uid = NULL) {
    global $mysql;
    if (!$uid) {
      $uid = $GLOBALS['user']->uid;
    }
    if (self::get_project_by_title($title, $uid, $uid)) {
      throw new DuplicateProjectExistsException('A project with the same title ' . $title . ' already exists', 400);
    }
    // Leave a placeholder for the root file identifier
    $mysql->query("INSERT INTO project(pid, title, description, uid, root_id, updated, created) VALUES('', '%s', '%s', %d, %d, %d, %d)", $title, $description, $uid, -1, time(), time());
    $pid = mysql_insert_id();
    if ($pid) {
      $root_id = File::create_file($uid, $pid, array('title' => $title)); // Name of the root folder must be the same as that of the project
      $mysql->query("UPDATE project SET root_id=%d WHERE pid=%d", $root_id, $pid);
      return $pid;
    }
    else throw new InternalException('Internal Server error', 500);
  }
  
  /**
   * Removes a project with the given identifier
   * 
   * @param $pid
   *   Project identifier of the project
   * @param $uid
   *   User identifier of the user requesting deletion
   */
  public static function remove_project_by_pid($pid, $uid) {
    // TODO Access control with project ID and user ID
    if (!empty($pid)) {
      if (($project = Project::get_project_by_pid($pid))) {
        global $mysql;
        $mysql->query('DELETE FROM project WHERE pid=%d', $pid);
        $mysql->query('DELETE f.*, h.* FROM file f, hierarchy h WHERE (f.fid=h.parent_fid OR f.fid=h.child_fid) AND f.pid=%d', $pid); 
        $mysql->query('DELETE FROM file WHERE pid=%d', $pid); // Cleanup
        return TRUE;
      }
    }
    throw new ProjectNotFoundException('The project to be deleted was not found', 404);
  }
};

class User extends Model {
  
  /**
   * Implements Model#all() from the abstract base class that this class inherits from
   */
  public static function all() {
    $projects = array();
    $result = $GLOBALS['mysql']->query('SELECT * FROM user');
    while($row = $result->fetch_array()) {
      $projects[] = self::format_project($row);
    }
    return $projects;
  }
  
  /**
   * Gets a user by his unique user ID
   * 
   * @param $uid
   *   Unique user ID
   */
  public static function get_user_by_uid($uid) {
    global $mysql;
    $result = $mysql->query("SELECT * FROM user WHERE uid=%d", $uid);
    if ($result) {
      $user = $result->fetch_object();
      unset($user->password); // Password need not be sent
      return $user;
    }
    else {
      throw new UserNotFoundException("A user with user ID $uid was not found or cannot be accessed");
    }
  }
};

?>