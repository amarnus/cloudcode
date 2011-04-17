<?php 

class ModelException extends Exception {};
class FileNotFoundException extends ModelException {};
class UnauthorizedAccessException extends ModelException {};
class ProjectNotFoundException extends ModelException {};
class DuplicateFileExistsException extends ModelException {};
class DuplicateProjectExistsException extends ModelException {};
class InternalException extends ModelException {};
class PathNotFoundException extends ModelException {};
class ArgumentNotFoundException extends ModelException {};
class NotDirectoryException extends ModelException {};
class UnsupportedFileTypeException extends ModelException {};
class UserNotFoundException extends ModelException {};