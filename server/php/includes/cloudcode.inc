<?php 

/**
 * Adds a new name-value pair to a query string
 * 
 * @param $query_string
 *   Query string is a serialized version of a name-value hash map
 * @param $name
 *   Name of the field to be added to the query string
 * @param $value
 *   Value contained in the field to be added to the query string. This is the value mapped to $name
 */
function add_field_to_query_string($query_string, $name, $value) {
  // http://example.com?foo=bar&apple=microsoft
  $parts = explode('?', $query_string);
  if (count($parts) > 1) {
    $fields = explode('&', $parts[1]);
    array_push($fields, "$name=$value");
    return $parts[0] . '?' . implode('&', $fields);
  }
  else {
    return $parts[0] . "?$name=$value";
  }
}

/**
 * Custom callback handler for errors/warnings/notices
 *
 * This method handles the display of all front-end notices from the web server to the client
 * 
 * @param $errno
 *   Type of the error is identified by this integer. Can be E_USER_ERROR, E_USER_WARNING or E_USER_NOTICE
 * @param $errstring
 *   Error message to be presented to the user
 * @param $errfile
 *   Name of the file in which the error occured
 * @param $errline
 *   The exact line number in the file in which the error occured
 * @param $errorcontext
 *   Points to the active symbol table at the point where the error occurred i.e.
 *   includes all the variables in the scope in which the error occurred
*/
function cloudcode_error_handler($errno, $errstring, $errfile, $errline, $errcontext) {
  $message = '';
  switch($errno) {
    case E_USER_NOTICE:
      $message = "<div class='message notice'>$errstring</div>";
      break;
    case E_USER_WARNING:
      $message = "<div class='message warning'>$errstring</div>";
      break;
    case E_USER_ERROR:
      $message = "<div class='message error'>$errstring</div>";
      break;
  }
  
  // Add message to the message stack
  if (!empty($message))
    $_SESSION['messages'][] = $message;
}

/**
 * 
 * Application executor
 * 
 * Basically, an application is a set of tuples of urls which are regular expressions
 * and their handlers which are PHP classes. Methods of the handler class inherited from
 * CloudcodeApplication are used to serve different types of HTTP requests i.e. GET, POST, PUT, DELETE etc.
 * 
 * This method bootstraps the Cloudcode core, resolves the currently requested path and triggers
 * the handler for the current path. Flags a fatal error when the required handler is not found or if the path
 * did not match any of the given patterns in the application
 * 
 * @param $application
 *   An array of (url, handler) tuples
 */
function cloudcode_run_application($application = array()) {
  global $cloudcode;
  $found = false;
  $cloudcode = new Cloudcode();
  $cloudcode->bootstrap();
  $request_args = array();
  foreach($_SERVER['argv'] as $argument) {
    list($key, $value) = explode('=', $argument);
    $request_args[$key] = $value; 
  }
  if (!isset($request_args['p'])) {
    $request_args['p'] = '/';
  }
  else {
    $request_args['p'] = @current(explode('&', $request_args['p']));
  }
  foreach($application as $path => $info) {
    $path = sprintf('/^%s$/', str_replace('/', '\/', $path));
    if (preg_match($path, $request_args['p'], $matches)) {
      $found = true;
      if (isset($info['handler_class']) && !class_exists($info['handler_class']))
        unset($info['handler_class']);
      $info += array(
        'handler_class' => 'MainHandler',
        'access' => 'Access::anonymous_access'
      );
      $handler = new $info['handler_class'];
      $access = call_user_func($info['access']);
      break;
    }
  }
  
  // If the current HTTP request is not for any page
  // Return PAGE_NOT_FOUND error
  if (!$found)
    CloudcodeApplication::error(404);
   
  // If the current user does not have access to the
  // current page, return ACCESS_DENIED
  if (!$access) {
    // The url to be redirected to should be the parameter
    // to the main page and must include the query string of the current page
    if (strtoupper($_SERVER['REQUEST_METHOD']) == 'GET') {
      $redirect_url = $_SERVER['PHP_SELF'] . '?continue=' . urlencode($_SERVER['REQUEST_URI']); 
      header('Location: ' . $redirect_url);
      exit;
    }
    CloudcodeApplication::error(403);
  }
  
  switch(strtoupper($_SERVER['REQUEST_METHOD'])) {  
    case 'GET':
      return $handler->get();

    case 'POST':
      return $handler->post();

    case 'DELETE':
      return $handler->delete();
 
    case 'PUT':
      return $handler->put();
  }
}

/**
 *
 * Main Cloudcode class
 *
 */
 class Cloudcode {
   
   public $base_path;
   public $theme_base_path;
   public $ALLOWED_FILE_TYPES = array(
     'html' => 'text/html',
     'css' => 'text/css',
     'txt' => 'text/plain',
     'js' => 'application/javascript',
     'json' => 'application/json',
     'xml' => 'application/xml',
     'png' => 'image/png',
     'jpeg' => 'image/jpeg'
   );
   
   /**
    * 
    * Get or set the base file path of the server app
    * 
    * @param $path
    *   Can be used to set the base path of the app or get the base path if its value is NULL
    * @return 
    *   Base path of the app if it is being set or if it has already been set
    *   NULL if it is not being set and has not been set before
    */
   protected function set_base_path($path = NULL) {
     if (isset($this->base_path) && !empty($this->base_path)) {
       return $this->base_path;
     }
     if (!is_null($path) && strlen($path)) {
       return ($this->base_path = $path);
     }
     return NULL;
   }
   
   /**
    * 
    * Load the settings file if it exists
    * 
    * Checks if the required settings file exists. If not, throws an error
    */
   public function load_settings() {
     $expected_path = $this->base_path . '/settings.php';
     if (file_exists($expected_path)) {
       return require_once($expected_path);
     }
     CloudcodeError::fatal_error('The required settings.php file was not found. Ensure that it is found in the base of your Cloudcode server folder');
   }
   
   /**
    * 
    * Bootstrap the server application
    */
   public function bootstrap() {
     $session_id = session_id();
     if (!$session_id) {
       session_start();
     }
     global $mysql, $base_url, $user, $store;
     // Create global user object from the session if it exists
     if (isset($_SESSION['user']))
       $user = $_SESSION['user'];
     $base_url = dirname($_SERVER['PHP_SELF']);
     // Register custom callback for errors
     set_error_handler('cloudcode_error_handler');
     // Parent directory of the running script must be the source
     // directory of the application because the running script
     // can only be index.php. Prepend the document root to it to 
     // get the full file path similar to __FILE__
     $this->set_base_path($_SERVER['DOCUMENT_ROOT'] . dirname($_SERVER['PHP_SELF'])); 
     $this->theme_base_path = $this->base_path . '/themes/default';
     $this->theme_base_url = $base_url . '/themes/default';
     // Load all the files in the include directory
     $includes = glob($this->base_path . '/includes/*.inc');
     if (is_array($includes)) {
       foreach($includes as $include) {
         require_once($include);
       }
     }
     // Create the global query object to be used for all queries in the page
     $mysql = new MySQLQuery();
     
     // Setup the OAuth store
     require('oauth/OAuthStore.php');
     $store = OAuthStore::instance('MySQL', array('conn' => $mysql->db_connected));
   }
 };
 
 
 class CloudcodeError {
   
   /**
    * 
    * Similar to CloudcodeError::error except that it exits after
    * triggering the error callback
    * @param $message
    *   Message to be passed to the error callback
    * @see CloudcodeError::error
    */
   public static function fatal_error($message) {
     self::error($message);
     die;
   }
   
   /**
    * 
    * Flags the message to be passed to the error callback as an error
    * for the benefit of the user
    * @param $message
    *   Message to be passed to the error callback
    */
   public static function error($message) {
     trigger_error($message, E_USER_ERROR);
   }
   
   /**
    * 
    * Flags the message to be passed to the error callback as an warning
    * for the benefit of the user
    * @param $message
    *   Message to be passed to the error callback
    */
   public static function warning($message) {
     trigger_error($message, E_USER_WARNING);
   }
   
   /**
    * 
    * Flags the message to be passed to the error callback as a notice
    * for the benefit of the user
    * @param $message
    *   Message to be passed to the error callback
    */
   public static function notice($message) {
     trigger_error($message, E_USER_NOTICE);
   } 
   
 };
 
 class CloudcodeApplication {
   
   /** 
    * Constructor
    */
   public function __construct() {
     // Add initial properties of the response object here 
     $this->args = isset($_GET['p']) ? array_filter(explode('/', $_GET['p']), create_function('$elem', 'if (strlen($elem)) return urldecode($elem);')) : array();
   }
   
   /**
    * Current page url 
    */
   public function request_url() {
     global $base_url;
     return $base_url . '/' . $_SERVER['PHP_SELF'];
   }
   
   /**
    * Gets list of arguments from the current url
    */
   public function args() {
     static $args;
     if (!isset($args)) {
       $args = explode('/', $_GET['p']);
     }
     return array_filter($args, function($arg) { return !empty($arg); });
   }
   
   /**
    * Redirect user to a different url
    * 
    * @param $url
    *   URL of the page to redirect the user to
    * @param $status_code
    *   HTTP status code of the redirect
    *     Can be 301, 302, 303, 304, 305, 307
    */
   public function redirect($url = NULL, $status_code = 302) {
     global $base_url;
     $url = $base_url . $url;

     // If the user has been redirected to here from another page
     // to prevent a double redirect, just forward the referrer
     if (isset($_GET['continue'])) {
       $url = add_field_to_query_string($url, 'continue', urlencode($_GET['continue']));
     } 
     if (!is_null($url) && strlen($url)) {
       header("Location: $url", TRUE, $status_code);
       exit;
     }
     else {
       CloudcodeError::error(404);
     }
   }
   
   /**
    * Respond to the current page request with an error
    * 
    * @param $status_code
    *   HTTP Status code to be sent with the response
    * @param $message
    *   Message to be set as the body of the response sent with the status_code
    */
   public static function error($status_code = 404, $message = "") { 
     // Taken from http://api.drupal.org/api/drupal/includes--common.inc/function/drupal_http_request/6
     static $responses = array(
        100 => 'Continue', 
        101 => 'Switching Protocols', 
        200 => 'OK', 
        201 => 'Created', 
        202 => 'Accepted', 
        203 => 'Non-Authoritative Information', 
        204 => 'No Content', 
        205 => 'Reset Content', 
        206 => 'Partial Content', 
        300 => 'Multiple Choices', 
        301 => 'Moved Permanently', 
        302 => 'Found', 
        303 => 'See Other', 
        304 => 'Not Modified', 
        305 => 'Use Proxy', 
        307 => 'Temporary Redirect', 
        400 => 'Bad Request', 
        401 => 'Unauthorized', 
        402 => 'Payment Required', 
        403 => 'Forbidden', 
        404 => 'Not Found', 
        405 => 'Method Not Allowed', 
        406 => 'Not Acceptable', 
        407 => 'Proxy Authentication Required', 
        408 => 'Request Time-out', 
        409 => 'Conflict', 
        410 => 'Gone', 
        411 => 'Length Required', 
        412 => 'Precondition Failed', 
        413 => 'Request Entity Too Large', 
        414 => 'Request-URI Too Large', 
        415 => 'Unsupported Media Type', 
        416 => 'Requested range not satisfiable', 
        417 => 'Expectation Failed', 
        500 => 'Internal Server Error', 
        501 => 'Not Implemented', 
        502 => 'Bad Gateway', 
        503 => 'Service Unavailable', 
        504 => 'Gateway Time-out', 
        505 => 'HTTP Version not supported'
     );    
     if (isset($responses[$status_code])) {
       header(sprintf("HTTP/1.0 %d %s", $status_code, $responses[$status_code]));
       die($message);
     }
   }
     
   /**
    * 
    * Renders a page to the screen
    */
   public function render_page($options = array()) {
     global $cloudcode, $base_url;
     $siteoptions = array(
       'name' => 'CloudCode',
       'description' => 'Collaborative Code Editing in the Cloud',
     );
     if (isset($_SESSION['messages'])) {
       $options['messages'] = array_reverse($_SESSION['messages']);
       unset($_SESSION['messages']);
     }
     $options += array(
       'title' => $siteoptions['name'],
       'author' => 'Cloudcode',
       'description' => $siteoptions['description'],
       'content' => '',
       'links' => array(),
       'styles' => array(),
       'behaviors' => array(),
       'sitename' => $siteoptions['name'],
       'sitedescription' => $siteoptions['description'],
       'messages' => array()
     );
     array_unshift($options['behaviors'], array(
       'type' => 'script',
       'src' => 'http://ajax.aspnetcdn.com/ajax/jquery/jquery-1.4.4.js'
     ));
     $options['styles'] += array($cloudcode->theme_base_url . '/static/style.css');
     extract($options, EXTR_SKIP);
     $expected_file = $cloudcode->theme_base_path . '/page.tpl.php';
     if (!file_exists($expected_file)) {
       CloudcodeError::fatal_error("Required page template $expected_file was not found");
     }
     else {
       require_once($expected_file);
     }
     exit;
   }
   
    /**
     * Any of these methods is called when a request is made to an application instance
     * i.e. an object of a class inherited from CloudcodeApplication and these
     * methods are not overriden in that class
     */
    public function get() {}
    
    public function post() {}
   
    public function delete() {}
    
    public function put() {}
 };

?>