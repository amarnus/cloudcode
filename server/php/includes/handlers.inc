<?php 

class InstallationProfile {
  public static $tables = array(
    'user' => 
    	'CREATE TABLE user(
    		uid BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    		email VARCHAR(100) NOT NULL, 
    		password VARCHAR(40) NOT NULL, 
    		created BIGINT NOT NULL, 
    		last_login BIGINT NOT NULL
    	 ) ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_bin',
  
    'project' => 
    	'CREATE TABLE project(
    		pid BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    		title VARCHAR(50) NOT NULL, 
    		description MEDIUMTEXT NOT NULL, 
    		uid BIGINT NOT NULL,
    		root_id BIGINT NOT NULL, 
    		created BIGINT NOT NULL, 
    		updated BIGINT NOT NULL
    	) ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_bin',
  
    'file' => 
    	'CREATE TABLE file(
    		fid BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    		title VARCHAR(50) NOT NULL, 
    		type VARCHAR(50) NOT NULL,
    		path VARCHAR(200) NOT NULL,
    		is_directory INT NOT NULL,
    		ext VARCHAR(10) NOT NULL,
    		content LONGTEXT NOT NULL,
    		uid BIGINT NOT NULL,
    		pid BIGINT NOT NULL,
    		permissions INT NOT NULL,
    		created BIGINT NOT NULL, 
    		updated BIGINT NOT NULL
    	) ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_bin',
  
    'hierarchy' => 
       'CREATE TABLE hierarchy(
    		parent_fid BIGINT NOT NULL,
    		child_fid BIGINT NOT NULL,
    		PRIMARY KEY(parent_fid, child_fid)
  	) ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_bin',
  
    'member' => 
       'CREATE TABLE member(
    		pid BIGINT NOT NULL,
    		uid BIGINT NOT NULL,
    		PRIMARY KEY(pid, uid)
    	) ENGINE = INNODB CHARACTER SET utf8 COLLATE utf8_bin',
  );
};

class InstallHandler extends CloudcodeApplication { 
  /**
   * Create an administrator account
   */
  private function create_administrator() {
    global $mysql;
    $sql = "INSERT INTO user(uid, email, password, created, last_login) 
    	    VALUES (%d, '%s', '%s', %d, %d)";
    if ($mysql->query($sql, 1, 'amarnus@gmail.com', md5('mystartup'), time(), 0))
      CloudcodeError::notice('Administrator account has been created for amarnus@gmail.com');
  }
  
  /**
   * Checks if an administrator has already been created
   */
  private function administrator_created() {
    global $mysql;
    return $mysql->query('SELECT COUNT(*) FROM user WHERE uid=%d', 1)->result();
  }
  
  function get() {
    global $mysql;
    $options = array(
      'title' => 'Installation',
      'description' => 'Tables required by Cloudcode are created here'
    );
    foreach(InstallationProfile::$tables as $table => $sql) {
      if (!$mysql->table_exists($table)) {
        if ($mysql->query($sql))
          CloudcodeError::notice("Table $table has been created");
      }
      else {
        CloudcodeError::warning("Table $table already exists");
      }
    }
    if (!$this->administrator_created()) {
      $this->create_administrator();
    }
    $this->render_page($options);
  }
};

class UninstallHandler extends CloudcodeApplication {
  function get() {
    $options = array(
      'title' => 'Uninstall',
      'description' => 'Removes all tables created during the installation of Cloudcode'
    );
    foreach(array_keys(InstallationProfile::$tables) as $table) {
      global $mysql;
      if ($mysql->table_exists($table)) {
        $mysql->query("DROP TABLE $table");
        CloudcodeError::notice("Table $table has been dropped");
      }
      else {
        CloudcodeError::warning("Table $table does not exist");
      }
    }
    $this->render_page($options);
    if (session_id())
      session_destroy(); // Destroy existing session
  }
}

class MainHandler extends CloudcodeApplication {
  function get() {
    global $user, $base_url;
    if (isset($user)) {
      $options = array(
        'title' => 'Dashboard',
        'description' => 'List of all applications created by the user',
        'content' => 'Hello ' . $user->uid . '(<a href="' . $base_url . '/logout">Logout</a>)'
      );
      return $this->render_page($options);
    }
    else {
      $this->redirect('/user/login');
    }
  }
};

class LogoutHandler extends CloudcodeApplication {
  function get() {
    session_destroy();
    $this->redirect('/');
  }
}

class LoginHandler extends CloudcodeApplication { 
  /**
   * Validates a given email address
   * @param $email
   *   The email address to be validated
   * @return
   *   TRUE if the email is valid
   *   FALSE if not
   */
  public static function validate_email($email) {
    if (!empty($email)) {
      return (preg_match('/^[a-zA-Z].*\@[a-zA-Z].*\..*$/', $email) > 0);
    }
  }
  
  /**
   * Handles the submission of the user-login form
   * @param $values
   *   An array of form values to this handler from the submission
   */
  public static function user_login_handler($values) {
    if (!isset($values['email']) || !isset($values['password'])) {
      return; // Random error
    }
    else if (empty($values['email']) || empty($values['password'])) {
      CloudcodeError::error('Fields email and password cannot be empty');
    }
    else if (!self::validate_email($values['email'])) {
      CloudcodeError::error('The email address you have entered is invalid');
    }
    else {
      // Valid email address and a non empty password
      global $mysql;
      $found = $mysql->query('SELECT COUNT(*) FROM user WHERE email="%s" AND password="%s";', $values['email'], md5($values['password']))->result(); 
      if (!$found) {
        CloudcodeError::error('The email or password is incorrect');
      }
      else {
        $_SESSION['user'] = $user = $mysql->query('SELECT uid, email FROM user WHERE email="%s";', $values['email'])->fetch_object();
        global $base_url;
        if (!$_REQUEST['continue']) {
          self::redirect('/');
        }
        else {
          header('Location: ' . $_REQUEST['continue']);
          exit;
        }
      }
    }
  }
  
  /**
   * (non-PHPdoc)
   * @see includes/CloudcodeApplication::post()
   */
  function post() {
    $form = new Form('user-login');
    $form->register_handler('LoginHandler', 'user_login_handler');
  }
  
  /**
   * (non-PHPdoc)
   * @see includes/CloudcodeApplication::get()
   */
  function get() {
    global $user;
    if ($user->uid) {
      if (isset($_GET['continue'])) {
        header('Location: ' . urldecode($_GET['continue']));
        exit;
      }
      else {
        $this->redirect('/'); // Go to the user's homepage
      }
    }
    else {
      $form = new Form('user-login');
      $title = 'User Login';
      if ($_GET['continue']) {
        $title = 'Sign in to access that page';
      }
      $options = array(
        'title' => $title,
        'description' => 'Let me know who you are so I can send you to your account',
        'content' => $form->render('user-login')
      );
      return $this->render_page($options);
    }
  }
}

class ApiHandler extends CloudcodeApplication {
  
  /**
   * Calls PHP's json encode and sanitizes the result
   * 
   * @param $value
   *   Object whose JSON representation is required
   *   
   * @filesource http://api.drupal.org/api/drupal/includes--common.inc/function/drupal_json_encode/7
   */
  private function json_encode_and_spit($value) {
    header('Content-Type: application/json');
    echo str_replace(array('<', '>', '&'), array('\u003c', '\u003e', '\u0026'), json_encode($value)); 
    exit;
  }
  
  /**
   * Sanitizes each of the arguments to prevent injection attacks
   * 
   * @param $args
   *   An array of arguments passed with the HTTP request
   * @param $required_keys
   *   An array of expected arguments for a particular request
   */
  private function sanitize_args($args = array(), $required_keys = array()) {
    $args = array_map(function($arg) { 
        return htmlspecialchars($arg, ENT_QUOTES, 'UTF-8');
      },
      $args
    );
    if (isset($args['p'])) {
      unset($args['p']);
    }
    $difference = array_diff($required_keys, array_keys($args));
    if (count($difference) > 0) {
      throw new ArgumentNotFoundException('The following required parameters were not passed: ' . implode(', ', array_values($difference)), 400);
    }
    return $args;
  }
  
  /**
   * Dispatcher which identifies a request and calls the required callback
   * 
   * @param $uid
   *   User identifier of the user making the call
   * @param $request
   *   OAuthRequestVerifier object 
   */
  private function handle_request($uid, $request) {
    global $mysql;
    $request_string = trim(implode('/', $this->args())); 
    if ($_SERVER['REQUEST_METHOD'] == 'GET') {
      switch($request_string) {
        case 'api/account':
          $this->get_user($uid, $request);
          break;
        case 'api/projects':
          $this->get_projects($uid, $request);
          break;
        case 'api/project/fork':
          break;
        case 'api/project':
          $this->get_project($_REQUEST, $uid, $request);
          break;  
        case 'api/files':
          $this->get_files($_REQUEST, $uid, $request);
          break;    
        case 'api/file':
          $this->get_file($_REQUEST, $uid, $request);
          break;
      } 
    } 
    else if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      switch($request_string) {
        case 'api/file':
          $this->update_file($_REQUEST, $uid, $request);
          break;
        case 'api/files':
          $this->create_file($_REQUEST, $uid, $request);
          break;
        case 'api/projects':
          $this->create_project($_REQUEST, $uid, $request);
          break; 
        case 'api/directory':
          $this->create_directory($_REQUEST, $uid, $request);
          break;
      }
    }
    else if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
      switch($request_string) {
        case 'api/file':
          $this->remove_file($_REQUEST, $uid, $request);
          break;
        case 'api/project':
          $this->remove_project($_REQUEST, $uid, $request);
          break;
        default:
          $this->error(405);
          break;
      }
    }
    else {
      $this->error(405);
    }
  }
  
  private function request() {
    require_once('oauth/OAuthRequestVerifier.php');
    if (OAuthRequestVerifier::requestIsSigned()) {
      try {
        $request = new OAuthRequestVerifier();
        $uid = $request->verify();
        if ($uid && $uid > 0) { 
          $this->handle_request($uid, $request); 
        }
        else {
          $this->error(404);
        }
      }
      catch (OAuthException $e) {
        header('WWW-Authenticate: OAuth realm=""');
        header('Content-Type: text/plain; charset=utf8');                  
        echo $e->getMessage();
        $this->error(401);
      }
    } 
  }
  
  /**
   * Wrapper around the core dirname function to ensure that
   * the directory name always ends with a trailing slash
   * 
   * @param $string
   *   String path identifying some location
   */
  private function dirname($string) {
    $string = dirname($string);
    if (substr($string, -1) != "/") {
      $string .= "/";
    }
    return $string;
  }
  
  /**
   * PUBLIC API methods
   */
  
  /**
   * Creates a new directory
   * 
   * @param $args
   *   Arguments required for this call
   * @param $uid
   *   User identifier of the user making this call
   */
  protected function create_directory($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid', 'title', 'path'));
      $args['is_directory'] = 1;
      $path = isset($args['path']) ? $this->dirname($args['path']) : '/';
      $project = Project::get_project_by_pid(intval($args['pid']), $uid, $uid);
      $fid = File::create_child($project['pid'], $path, $args, $uid);
      $this->json_encode_and_spit(array('fid' => $fid));
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    };
  }
  
  /**
   * Creates a new file
   * 
   * @param $args
   *   An array of parameters to be passed with this call
   * @param $uid
   *   User identifier of the user making this call
   */
  protected function create_file($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid', 'path'));
      $args['is_directory'] = 0;
      $args['content'] = $request->getBody();
      $path = isset($args['path']) ? $this->dirname($args['path']) : '/';
      $project = Project::get_project_by_pid(intval($args['pid'], 10), $uid, $uid);
      $fid = File::create_child($project['pid'], $path, $args, $uid);
      $this->json_encode_and_spit(array('fid' => $fid));
    } 
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    }
  }
  
  /**
   * Creates a new project
   * 
   * @param $args:
   *   An array of parameters to be passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function create_project($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('title'));
      $description = @file_get_contents('php://input');
      $pid = Project::create_project($args['title'], $description, $uid);
      $this->json_encode_and_spit(array('pid' => $pid));
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    }
  }
  
  /**
   * Gets information about the current user
   * 
   * @param $args:
   *   An array of parameters to be passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function get_user($uid) {
    try {
      $user = User::get_user_by_uid($uid);
      $this->json_encode_and_spit($user);
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    };
  }
  
  /**
   * Gets information about a particular file or directory in a project
   * 
   * @param $args:
   *   An array of parameters to be passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function get_file($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid', 'fid'));
      $project = Project::get_project_by_pid($args['pid'], $uid, $uid);
      $file = File::get_file_by_fid($args['fid']);
      $this->json_encode_and_spit($file);
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    };
  }
  
  /**
   * Gets all files inside a folder
   * 
   * @param $args
   *   An array of parameters to be passed with this call
   * @param $uid
   *   User identifier of the user making this call
   */
  protected function get_files($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid', 'path'));
      $path = !isset($args['path']) ? '/' : $args['path'];
      $project = Project::get_project_by_pid($args['pid'], $uid, $uid);
      $files = File::get_children($project['pid'], $path, $uid);
      $this->json_encode_and_spit($files);
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    }
  }

  /**
   * Gets information about a specific project
   * 
   * @param $args
   *   An array of parameters to be passed with this call
   * @param $uid
   *   User identifier of the user making this call
   */
  protected function get_project($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid'));
      $project = Project::get_project_by_pid($args['pid'], $uid, $uid);
      $this->json_encode_and_spit($project);
    }
    catch (Exception $e) {
      $this->error($e->getCode(), $e->getMessage());
    }
  }
 
  /**
   * Retrieves information about all projects
   * 
   * @param $uid
   *   Owner whose projects need to be retrieved
   */
  protected function get_projects($uid, $request) {
    $projects = Project::all();
    $this->json_encode_and_spit($projects);
  }
  
  /**
   * Updates information about a file including content
   * 
   * @param $args:
   *   Parameters passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function update_file($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid', 'fid'));
      $options = get_object_vars(json_decode($request->getBody()));
      $project = Project::get_project_by_pid($args['pid'], $uid, $uid);
      File::update_file_by_fid($args['fid'], $args['pid'], $options, $uid);
    }
    catch(Exception $e) {
      $this->error($e->getCode(), $e->getMessage()); 
    }
  }
  
  /**
   * Deletes a file from a given project
   * 
   * @param $args:
   *   Parameters passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function remove_file($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('fid', 'pid'));
      $project = Project::get_project_by_pid($args['pid'], $uid, $uid);
      File::remove_file_by_fid($args['fid'], $project['pid'], $uid);
    } 
    catch(Exception $e) {
      $this->error($e->getCode(), $e->getMessage()); 
    }
  }
  
  /**
   * Deletes a given project
   * 
   * @param $args:
   *   Parameters passed with this call
   * @param $uid:
   *   User identifier of the user making this call
   */
  protected function remove_project($args, $uid, $request) {
    try {
      $args = $this->sanitize_args($args, array('pid'));
      Project::remove_project_by_pid($args['pid'], $uid);
    } 
    catch(Exception $e) {
      $this->error($e->getCode(), $e->getMessage()); 
    }
  }
  
  public function post() {
    $this->request();
  }
  
  public function put() {
    $this->request();
  }
  
  public function get() {
    $this->request();
  }
  
  public function delete() {
    $this->request();
  }
}


class OAuthHandler extends CloudcodeApplication {
  
  /**
   * Handles form submit of the Consumer Register form
   * @param $values
   *   An array of submitted values for each of the form fields
   */
  private static function consumer_register_handler($values) {
    // No submitted values needed
    global $user, $store;
    if (isset($user->uid) && $user->uid) { // Ensure user is logged in
      $consumer = array(
        'requester_name' => $user->email,
        'requester_email' => $user->email
      );
      $store->getConsumer($store->updateConsumer($consumer, $user->uid), $user->uid);
      CloudcodeError::notice('Your consumer keys have been updated');
    }
  }
  
  function post() {
    $args = $this->args();
    if (count($args) < 2) {
      $this->error(403);
    }
    switch($args[1]) {
      case 'request_token':
        return $this->get();
        
      case 'access_token':
        require_once('oauth/OAuthServer.php');
        $server = new OAuthServer();
        $token = $server->accessToken();
        break;
        
      case 'consumer':
        $form = new Form('consumer-register');
        $form->register_handler('OAuthHandler', 'consumer_register_handler');
        break;
    }
  }
  
  function get() {
    $args = $this->args();
    if (count($args) < 2) {
      $this->error(403);
    }
    
    switch($args[1]) {      
      case 'request_token':
        global $mysql;
        require_once('oauth/OAuthServer.php');
        $server = new OAuthServer();
        $token = $server->requestToken();
        break;
        
     case 'access_token':
        require_once('oauth/OAuthServer.php');
        $server = new OAuthServer();
        $token = $server->accessToken();
        break;
        
      case 'auth_token':
        global $user, $store, $mysql;
        if (!isset($user->uid) || !$user->uid) {
          $this->redirect('user/login?continue=' . $_SERVER['PHP_SELF']);
        }
        require_once('oauth/OAuthServer.php');
        $server = new OAuthServer();
        $server->authorizeVerify();
        $server->authorizeFinish(TRUE, $user->uid);
        break;
          
      case 'consumer':
        global $user, $store;
        $consumers = $store->listConsumers($user->uid);
        if (!empty($consumers)) {
          $consumer = end($consumers);
          $defaults = array(
            'consumer_key' => $consumer['consumer_key'],
            'consumer_secret' => $consumer['consumer_secret']
          );
        }
        $form = new Form('consumer-register', $defaults);
        $options = array(
          'title' => 'Register as a OAuth Consumer',
          'description' => 'Allows you to build client applications for this site',
          'content' => $form->render()
        );
        $this->render_page($options);
        
      default:
        $this->error(403);
    }
  }
}
 
class RegisterHandler extends CloudcodeApplication {
  
  /**
   * Handler to handle the submission of the user register form
   * @param $values
   *   An array of form values to be submitted
   */
  private static function user_register_handler($values) {
    if (!isset($values['email']) || !isset($values['password']) || !isset($values['verify_password'])) {
      CloudcodeError::error('Required fields cannot be empty');
    }
    else if (empty($values['email']) || empty($values['password']) || empty($values['verify_password'])) {
      CloudcodeError::error('Required fields cannot be empty');
    }
    else if (!LoginHandler::validate_email($values['email'])) {
      CloudcodeError::error('The email address entered is not valid');
    }
    else if ($values['password'] != $values['verify_password']) {
      CloudcodeError::error('The passwords entered do not match');
    }
    else {
      global $mysql;
      if ($mysql->query("INSERT INTO users(uid, email, password, created, last_login) VALUES('', '%s', '%s', %d, %d);", htmlspecialchars($values['email'], ENT_QUOTES, 'UTF-8'), md5($values['password']), time(), 0)) {
        CloudcodeError::notice('Your account has been successfully saved');
      }
      else {
        CloudcodeError::warning('There was a problem setting up your account. Please try again later.'); 
      }
    }
  }
  
  function post() {
    $form = new Form('user-register');
    $form->register_handler('RegisterHandler', 'user_register_handler');  
  }
  
  function get() {
    $form = new Form('user-register');
    $options = array(
      'title' => 'User Register',
      'description' => 'Register yourself with an account to login and use this service',
      'content' => $form->render('user-register')
    );
    return $this->render_page($options);
  }
};

class ApiHandlerTest extends ApiHandler {
  public function test() {
    // Can have an API console no?
  }
}

class MobwriteTestHandler extends CloudcodeApplication {
  public function get() {
    global $cloudcode;
    $content = '<form id="editor"><textarea name="editor" id="editor_editor" style="border: solid 3px #999;padding:4px;outline:none;" rows="20" cols="100"></textarea></form>';
    $options = array(
      'title' => 'Mobwrite',
      'description' => 'Client-server document synchronization over the web between multiple clients',
      'content' => $content,
      'behaviors' => array(
        'mobwrite' => array(
          'type' => 'script',
          'src' => 'http://mobwrite3.appspot.com/static/compressed_form.js'
        ),
        'custom' => array(
          'type' => 'inline',
          'src' => '
            $(document).ready(function() {
              mobwrite.syncGateway = "http://mobwrite3.appspot.com/scripts/q.py"; 
              mobwrite.share("editor"); 
            });'
        )
      )
    );
    $this->render_page($options);
  }
  
};

class TestHandler extends CloudcodeApplication {
  
  public function get() {
    $handler = new ApiHandlerTest();
    $handler->test();
    $options = array(
      'title' => 'Test Console',
      'description' => 'Playground',
      'content' => ''
    ); 
    $this->render_page($options);
  }
}

?>