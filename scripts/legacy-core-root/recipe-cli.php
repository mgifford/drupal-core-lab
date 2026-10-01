<?php

/**
 * List and apply Drupal Core recipes via the Core Recipe API.
 *
 * Exposes Drupal\Core\Recipe (Recipe, RecipeRunner) so core functionality can be
 * discovered and applied without Drupal CMS recipes. Run bootstrapped by Drush:
 *   drush php:script scripts/recipe-cli.php -- list
 *   drush php:script scripts/recipe-cli.php -- apply <recipe-name-or-path>
 */

// Drush's php:script passes arguments via the $extra array; the script name has
// already been removed, so $extra holds only our arguments. Fall back to
// $_SERVER['argv'] (slice off the script name) if run outside Drush.
$args = (isset($extra) && is_array($extra)) ? $extra : array_slice($_SERVER['argv'] ?? [], 1);
$command = $args[0] ?? 'help';
$recipeArg = $args[1] ?? NULL;

use Drupal\Core\Recipe\Recipe;
use Drupal\Core\Recipe\RecipeRunner;

// Directories scanned for recipes. core/recipes is the core surface; recipes/ holds
// our project recipes (e.g. replicate_core_testing); core/tests/fixtures/recipes holds
// core fixture recipes (article_content_type, page_content_type, ...).
$searchDirs = [
  'core/recipes',
  'recipes',
  'core/tests/fixtures/recipes',
];

function recipe_cli_find(string $nameOrPath, array $dirs): ?string {
  if (is_dir($nameOrPath) && file_exists($nameOrPath . '/recipe.yml')) {
    return rtrim($nameOrPath, '/');
  }
  foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
      continue;
    }
    $candidate = $dir . '/' . $nameOrPath;
    if (is_dir($candidate) && file_exists($candidate . '/recipe.yml')) {
      return $candidate;
    }
  }
  return NULL;
}

if ($command === 'list') {
  $found = FALSE;
  foreach ($searchDirs as $dir) {
    if (!is_dir($dir)) {
      continue;
    }
    $rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    foreach ($rii as $file) {
      if ($file->getFilename() !== 'recipe.yml') {
        continue;
      }
      $path = dirname($file->getPathname());
      try {
        $recipe = Recipe::createFromDirectory($path);
      }
      catch (\Throwable $e) {
        fprintf(STDERR, "  (invalid) %s — %s\n", $path, $e->getMessage());
        continue;
      }
      $found = TRUE;
      $deps = array_map(static fn(Recipe $r) => $r->name, $recipe->recipes->recipes);
      printf("%s\n  path:    %s\n  type:    %s\n  desc:    %s\n  depends: %s\n\n",
        $recipe->name, $path, $recipe->type, $recipe->description, implode(', ', $deps));
    }
  }
  if (!$found) {
    fprintf(STDERR, "No recipes found in: %s\n", implode(', ', $searchDirs));
  }
  return(0);
}

if ($command === 'apply') {
  if (!$recipeArg) {
    fprintf(STDERR, "apply requires a recipe name or path\n");
    return(2);
  }
  $path = recipe_cli_find($recipeArg, $searchDirs);
  if (!$path) {
    $alt = \Drupal::root() . '/' . ltrim($recipeArg, '/');
    if (is_dir($alt) && file_exists($alt . '/recipe.yml')) {
      $path = $alt;
    }
  }
  if (!$path) {
    fprintf(STDERR, "Recipe not found: %s\n", $recipeArg);
    return(3);
  }
  $recipe = Recipe::createFromDirectory($path);
  fprintf(STDOUT, "Applying recipe: %s (%s)\n", $recipe->name, $path);
  RecipeRunner::processRecipe($recipe);
  fprintf(STDOUT, "Applied %s and its dependencies.\n", $recipe->name);
  return(0);
}

fwrite(STDOUT, "Usage:\n  drush php:script scripts/recipe-cli.php -- list\n  drush php:script scripts/recipe-cli.php -- apply <recipe-name-or-path>\n");
return(0);
