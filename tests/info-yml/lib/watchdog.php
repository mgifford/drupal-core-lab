<?php

/**
 * @file
 * Reads dblog rows from a lab site's SQLite file without bootstrapping Drupal.
 *
 * Usage:
 *   php watchdog.php <sqlite-file> max        prints the highest wid
 *   php watchdog.php <sqlite-file> <wid>      prints rows newer than <wid> as JSON
 *   php watchdog.php <sqlite-file> <wid> full  the same, with each exception's backtrace
 *
 * Rows logged for an exception carry the class in %type and the message in
 * @message (\Drupal\Core\Utility\Error::decodeException()), so both are
 * returned separately.
 */

declare(strict_types=1);

[, $db, $arg, $full] = $argv + [NULL, NULL, NULL, NULL];
if (!$db || $arg === NULL) {
  fwrite(STDERR, "usage: php watchdog.php <sqlite-file> max|<wid>\n");
  exit(2);
}
try {
  $pdo = new PDO('sqlite:' . $db);
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  if ($arg === 'max') {
    echo (int) $pdo->query('SELECT MAX(wid) FROM watchdog')->fetchColumn(), "\n";
    exit(0);
  }
  $statement = $pdo->prepare('SELECT wid, type, severity, message, variables FROM watchdog WHERE wid > ? ORDER BY wid');
  $statement->execute([(int) $arg]);
  $rows = $statement->fetchAll(PDO::FETCH_ASSOC);
}
catch (PDOException $e) {
  echo json_encode(['error' => $e->getMessage()]), "\n";
  exit(0);
}
// Values may be markup objects; unserialized without their classes they are incomplete objects whose properties an
// array cast still exposes (Markup keeps its text in "string").
$string = function ($value): string {
  if (is_scalar($value) || $value === NULL) {
    return (string) $value;
  }
  $properties = (array) $value;
  foreach ($properties as $key => $property) {
    if (str_ends_with((string) $key, 'string') && is_string($property)) {
      return $property;
    }
  }
  return (string) json_encode($properties);
};
$out = [];
foreach ($rows as $row) {
  $variables = @unserialize((string) $row['variables'], ['allowed_classes' => FALSE]);
  $variables = is_array($variables) ? array_map($string, $variables) : [];
  $replacements = $variables;
  unset($replacements['@backtrace_string']);
  $text = strtr((string) $row['message'], $replacements);
  $out[] = [
    'wid' => (int) $row['wid'],
    'type' => $row['type'],
    'severity' => (int) $row['severity'],
    'class' => isset($variables['%type']) ? strip_tags($variables['%type']) : NULL,
    'exception_message' => isset($variables['@message']) ? html_entity_decode(strip_tags($variables['@message']), ENT_QUOTES) : NULL,
    'backtrace' => $full === 'full' && isset($variables['@backtrace_string']) ? $variables['@backtrace_string'] : NULL,
    'text' => mb_substr(html_entity_decode(strip_tags(str_replace('@backtrace_string', '', $text)), ENT_QUOTES), 0, 1000),
  ];
}
echo json_encode($out, JSON_UNESCAPED_SLASHES), "\n";
