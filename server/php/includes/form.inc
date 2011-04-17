<?php 

class Form {
  
  private $form_build_id = NULL;
  private $template_name = NULL;
  private $form_id = NULL;
  private $variables = array();
  
  private function generate_build_id() {
    return $this->form_build_id = $_SESSION['form'][$this->form_id]['form_build_id'] = 'form-'. md5(uniqid(mt_rand(), TRUE));
  }
  
  // Constructor
  public function __construct($form_id = NULL, $variables = array()) {
    if (is_null($form_id)) {
      return FALSE;
    }
    $this->form_id = $form_id;
    $this->variables = !empty($variables) ? $variables : array();
    // Session would have already been started by
    // the bootstrapper, so we can safely check for
    // the session variables we are looking for
    if (!isset($_POST['form_build_id'])) {
      // We dont want to regenerate the build id
      // before the form is validated
      $this->generate_build_id();
    }
    return $this;
  }
  
  // Register a submit handler for this form
  public function register_handler($class, $method) {
    if (method_exists($class, $method)) {
      if (!isset($_POST['form_id'])) {
        $this->redirect();
      }
      $form_id = $_POST['form_id'];
      // Verify the build id
      if ($_POST['form_build_id'] !== $_SESSION['form'][$form_id]['form_build_id'])
        $this->redirect();
      $this->generate_build_id();
      $values = $_POST;
      unset($_POST);
      foreach(array('form_id', 'form_build_id', 'submit') as $key) {
        unset($values[$key]);
      }
      $values = array_map('urldecode', $values);
      call_user_func_array("$class::$method", array($values));
      $this->redirect();
    }
  }
  
  private function redirect() {
    header('Location: ' . $_SERVER['REDIRECT_URL']);
    exit;
  }
  
  private function serialize_form_id() {
    if ($this->form_id) {
      return str_replace('_', '-', $this->form_id);
    }
    return '';
  }
  
  // Form renderer
  public function render() {
    global $cloudcode;
    $template_name = $this->form_id;
    // A template is mandatory
    // Flag a warning if it is not present
    if (is_null($template_name)) {
      return CloudcodeError::warning("A template $template_name.tpl.php for the form needs to be specified");
    }
    $variables = array(
      'form_build_id' => $this->form_build_id,
      'form_id' => $this->form_id,
      'method' => 'POST',
      'action' => $_SERVER['REQUEST_URI'],
      'values' => array_fill(0, 100, ''),
      'class' => implode(' ', array('cloudcode-form', $this->serialize_form_id())) 
    );    
    $variables += $this->variables;
    // Template name could be the file itself..
    // or it could just be the name of the template passed as a string
    if (file_exists($template_name) || file_exists($template_name = $cloudcode->theme_base_path . "/$template_name.tpl.php")) {
      extract($variables, EXTR_SKIP);
      ob_start();
      $this->template_name = $template_name;
      include_once($template_name);
      $contents = ob_get_contents();
      ob_end_clean();
      return $contents;
    }  
    else {
      return CloudcodeError::warning("The form template $template_name does not exist");
    }
  }
}

?>