<?php 

class MySQLQuery {
  
  // Private parameter containing the MySQL connection
  // identifier
  public $db_connected = FALSE;
  public $db_name;
  
  /**
   * Constructor
   */
  public function __construct() {
    $this->connect();
  }
  
  /**
   * 
   * Establishes a connection to the MySQL server
   */
  private function connect() {
    if ($this->db_connected) {
      return; // Database connection has already been established using this Query object
    }
    if (!function_exists('mysql_connect')) {
      CloudcodeError::error('MySQL module for Apache is not installed but is required for the Cloudcode server to work.');
      return;
    }
    // Delay loading of the settings file as much as possible
    $GLOBALS['cloudcode']->load_settings();
    global $mysql_url;
    if (!isset($mysql_url) || !strlen($mysql_url)) {
      CloudcodeError::fatal_error('Your server has not been configured to use MySQL yet. Update the value of $mysql_url in settings.php');
    }
    // Get the host, username and password
    $components = parse_url($mysql_url);

    // Scheme denotes a short string that identifies the database server
    // implementation to use. Only MySQL is supported right now
    if (!isset($components['scheme']) || strtolower($components['scheme']) != 'mysql') {
      CloudcodeError::fatal_error(sprintf('%s database server is not supported right. Please use MySQL.', $components['scheme']));
    }
    // Three params are require to make a database connection
    // Password is assumed to be empty if it is not set
    if (!isset($components['user']) || !isset($components['host']) || !isset($components['path'])) {
      return FALSE;
    }
    $components['user'] = urldecode($components['user']);
    $components['pass'] = isset($components['pass']) ? urldecode($components['pass']) : '';
    $this->db_name = $components['path'] = substr(urldecode($components['path']), 1);

    // Support a connection on a non-standard port
    if (isset($components['port'])) {
      $components['host'] .= ':' . $components['path'];
    }
    $this->db_connected = @mysql_connect($components['host'], $components['user'], $components['pass'], !$this->db_connected);
    if (!$this->db_connected || !mysql_select_db($components['path'], $this->db_connected)) {
      CloudcodeError::fatal_error(mysql_error());
    }
  }
  
  /**
   * 
   * Run the given MySQL query
   * 
   * A formatted query with placeholders along with the values to be filled
   * in it are passed to this method prompting it to execute the query. An error
   * while running a query is reported
   * 
  */
  public function query() {
    $this->connect();
    $args = func_get_args(); // Get all the arguments
    $sql = array_shift($args);
    // Add values to placeholders if needed
    if (!empty($args)) {
      // Escape each of the arguments to prevent an SQL injection attack
      $args = array_map('mysql_real_escape_string', $args); 
      array_unshift($args, $sql);
      $sql = call_user_func_array('sprintf', $args);
    }
    $result = mysql_query($sql, $this->db_connected);
    if (mysql_errno($this->db_connected)) {
      CloudcodeError::warning(mysql_error());
    }
    return new MySQLQueryResult($result, mysql_num_rows($result));
  }
  
  /**
   * 
   * Check if a given table exists
   */
  public function table_exists($table = NULL) {
    if (!is_null($table) && strlen($table)) {
      $sql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '%s' AND table_name = '%s'";
      $this->connect();
      return $this->query($sql, $this->db_name, $table)->result();
    }
  }
};

class MySQLQueryResult {
  
  public $result;
  public $count;
  
  /**
   * 
   * Constructor 
   * @param $result
   *   MySQL Query Result resource
   */
  public function __construct($result, $count) {
    $this->result = $result;
    $this->count = $count;
  }
  
  /**
   * 
   * Wrapper method for mysql_fetch_object
   */
  public function fetch_object() {
    if (!is_null($this->result))
      return mysql_fetch_object($this->result);
  }
  
  /**
   * 
   * Wrapper method for mysql_fetch_array
   */
  public function fetch_array() {
    if (!is_null($this->result))
      return mysql_fetch_array($this->result);
  }
  
  /**
   * 
   * Wrapper method for mysql_result
   */
  public function result() {
    if (!is_null($this->result))
      return mysql_result($this->result, 0);
  }
  
};

?>