// Tests for scripts/code-map.mjs (one call for locate, read, callers and tests) on a small throwaway git checkout. No network, no model.
// Run: node --test tests/lab/code-map.test.mjs
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { labRoot } from '../../tools/compare/lib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'code-map-test-'));
after(() => fs.rmSync(root, { recursive: true, force: true }));
const w = (f, text) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), text); };
const git = (...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, encoding: 'utf8' });

w('.gitignore', 'ignored/\nvendor/\n');
w('core/modules/demo/src/Element/Widget.php', `<?php

namespace Drupal\\demo\\Element;

/**
 * Provides a demo widget.
 */
class Widget extends Base {

  /**
   * Processes the widget.
   *
   * More text that is not the first line.
   */
  #[SomeAttribute]
  public static function process(array &$element, $state) {
    $text = "a } brace in a string"; // and one } in a comment
    /* a block comment with { an open brace */
    $x = Helper::build($element);
    $y = $this->prepare($x);
    return self::finish($element, '{');
  }

  private function prepare($x) {
    return $x;
  }

  private static function finish($e, $s) {
    return $e;
  }

}
`);
w('core/modules/demo/src/Contract.php', '<?php\n\ninterface Contract {\n\n  public function declared(): void;\n\n}\n');
w('core/modules/demo/src/Other.php', '<?php\n\nclass Other {\n\n  public function process() {\n    return Widget::process($a, $b);\n  }\n\n}\n');
w('core/modules/demo/src/Unrelated.php', '<?php\n\nclass Unrelated {\n\n  public function go() {\n    return $this->process();\n  }\n\n}\n');
w('core/modules/demo/tests/src/Unit/WidgetTest.php', '<?php\n\nclass WidgetTest {\n\n  public function testIt() {\n    Widget::process($e, $s);\n  }\n\n}\n');
w('core/misc/ann.js', "(function (Drupal) {\n  Drupal.announce = function (text, priority) {\n    const brace = '}';\n    return text;\n  };\n})(Drupal);\n");
w('core/misc/user.js', 'Drupal.announce("hi");\nfunction announce() {}\n');
w('core/lib/Other/announce.php', '<?php\n\nclass announce {\n}\n');   // a PHP class named like the JS function: `Drupal.announce` must not find it
w('core/modules/demo/demo.module', '<?php\n\nfunction demo_preprocess_widget(&$v) {\n  $v["a"] = 1;\n}\n');
w('core/modules/demo/demo.libraries.yml', 'widget:\n  js:\n    ann.js: {}\nother:\n  css: {}\n');
w('core/modules/demo/templates/widget.html.twig', '{% block content %}\n  {{ widget }}\n{% endblock %}\n');
w('core/modules/demo/src/Long.php', `<?php\n\nclass Long {\n\n  public function longOne() {\n${'    $a = 1;\n'.repeat(120)}  }\n\n}\n`);
for (let i = 0; i < 60; i++) w(`core/modules/many/src/M${i}.php`, `<?php\n\nclass M${i} {\n  public function f() {\n    return common_helper(${i}) + common_helper(${i + 1});\n  }\n}\n`);
w('core/lib/common.php', '<?php\n\nfunction common_helper($x) {\n  return $x;\n}\n');
w('vendor/lib/Widget.php', '<?php\n\nclass Widget {}\n');
w('ignored/hidden.php', '<?php\n\n$z = Widget::process(1, 2);\n');
git('init', '-q', '-b', 'main'); git('add', '-A'); git('commit', '-q', '-m', 'base');
w('core/modules/demo/src/NewlyAdded.php', '<?php\n\nclass NewlyAdded {\n  function a() { return Widget::process(1, 2); }\n}\n');   // untracked, as a file added by a patch is

const map = (...a) => spawnSync('node', [path.join(labRoot, 'scripts/code-map.mjs'), root, ...a], { encoding: 'utf8' });

test('a method: where it is, its doc line, its whole body (braces in strings and comments do not end it), what it calls', () => {
  const r = map('Widget::process'); assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /definitions: 1/); assert.match(r.stdout, /core\/modules\/demo\/src\/Element\/Widget\.php:16\s+in Widget/);
  assert.match(r.stdout, /public static function process\(array &\$element, \$state\)/); assert.match(r.stdout, /doc: Processes the widget\./); assert.doesNotMatch(r.stdout, /More text that is not the first line/);
  assert.match(r.stdout, /body: lines 16-22 \(7 lines\)/); assert.match(r.stdout, /22│   }/);
  assert.match(r.stdout, /calls: prepare \(line 24\), finish \(line 28\)/); assert.match(r.stdout, /static calls: Helper::build/);
});

test('who uses it: other files and tests apart; vendored and ignored files are skipped; an untracked (patch-added) file is included; the definition file is not its own caller', () => {
  const r = map('Widget::process'); const used = r.stdout.split('tests:')[0];
  assert.match(used, /used by: 2 reference\(s\) in 2 file\(s\)/); assert.match(used, /core\/modules\/demo\/src\/Other\.php:6/); assert.match(used, /core\/modules\/demo\/src\/NewlyAdded\.php:4/);
  assert.match(r.stdout, /tests: 1 reference\(s\) in 1 file\(s\)\n\s+core\/modules\/demo\/tests\/src\/Unit\/WidgetTest\.php:6/);
  assert.doesNotMatch(r.stdout, /vendor\/lib|ignored\/hidden/);
});

test('Class::member only takes that class\'s definition, and only files that mention the class', () => {
  const r = map('Widget::process'); assert.doesNotMatch(r.stdout, /Unrelated\.php/); assert.doesNotMatch(r.stdout, /Other\.php:5/, 'another class\'s own `process` declaration is not a use');
  const bare = map('process'); assert.match(bare.stdout, /definitions: 2/); assert.match(bare.stdout, /Unrelated\.php/);
});

test('a class gives its members, not its body; an interface method gives its signature', () => {
  let r = map('Widget'); assert.match(r.stdout, /class Widget extends Base/); assert.match(r.stdout, /members \(3, class ends at 32\):/); assert.match(r.stdout, /16  public static function process/); assert.doesNotMatch(r.stdout, /\$text = /);
  r = map('declared'); assert.match(r.stdout, /public function declared\(\): void/); assert.match(r.stdout, /body: lines 5-5 \(1 lines\)/);
});

test('JS: Drupal.name finds the assignment first; a file outline lists functions with line numbers', () => {
  let r = map('Drupal.announce'); assert.match(r.stdout, /core\/misc\/ann\.js:2\s*\n\s+Drupal\.announce = function \(text, priority\)/); assert.match(r.stdout, /body: lines 2-5/); assert.match(r.stdout, /definitions: 2\b/); assert.doesNotMatch(r.stdout, /Other\/announce\.php/);
  r = map('core/misc/user.js'); assert.match(r.stdout, /core\/misc\/user\.js \(3 lines\)\n\s+2  function announce\(\)/);
  r = map('core/modules/demo/demo.libraries.yml'); assert.match(r.stdout, /1  widget:/); assert.match(r.stdout, /4  other:/);
  r = map('core/modules/demo/templates/widget.html.twig'); assert.match(r.stdout, /1  \{% block content %\}/);
  r = map('core/modules/demo/src/Element/Widget.php'); assert.match(r.stdout, /3  namespace Drupal\\demo\\Element;/); assert.match(r.stdout, /8  class Widget extends Base/); assert.match(r.stdout, /16  public static function process/);
});

test('a hook-like word with no definition still shows who uses it, with config files counted apart', () => {
  const r = map('widget'); assert.match(r.stdout, /definitions: none found/); assert.match(r.stdout, /config and templates: 2 reference\(s\) in 2 file\(s\)/);
});

test('output is bounded: a long body is cut with a note; a name used in 60 files lists a few and counts the rest', () => {
  let r = map('longOne', '--lines', '10'); assert.match(r.stdout, /body: lines 5-126 \(122 lines, first 10 shown; --lines 122 for all\)/); assert.ok(r.stdout.split('\n').length < 40);
  r = map('common_helper', '--refs', '4'); assert.match(r.stdout, /used by: 60 reference\(s\) in 60 file\(s\)/); assert.match(r.stdout, /… 56 more file\(s\)/); assert.ok(r.stdout.split('\n').length < 40, `${r.stdout.split('\n').length} lines`);
});

test('not found, bad arguments and a non-git folder', () => {
  let r = map('NoSuchThingAnywhere'); assert.equal(r.status, 1); assert.match(r.stdout, /not found: no definition and no reference/);
  r = map('bad name!'); assert.equal(r.status, 2); assert.equal(spawnSync('node', [path.join(labRoot, 'scripts/code-map.mjs'), root], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync('node', [path.join(labRoot, 'scripts/code-map.mjs'), root, 'x', '--lines'], { encoding: 'utf8' }).status, 2);
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'code-map-plain-')); r = spawnSync('node', [path.join(labRoot, 'scripts/code-map.mjs'), plain, 'x'], { encoding: 'utf8' }); fs.rmSync(plain, { recursive: true });
  assert.equal(r.status, 2); assert.match(r.stderr, /not a git checkout/);
});

test('it is read-only: the checkout is identical afterwards', () => {
  const snap = () => git('status', '--porcelain', '--untracked-files=all').stdout + git('rev-parse', 'HEAD').stdout;
  const a = snap(); map('Widget::process'); map('core/misc/user.js'); assert.equal(snap(), a);
});
