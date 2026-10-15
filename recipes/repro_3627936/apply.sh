#!/usr/bin/env bash
# Recipes only install, so the workspace the steps need is created here (the entity is content, not configuration). Idempotent.
set -euo pipefail
php -r '$a=require "autoload.php"; $r=Symfony\Component\HttpFoundation\Request::create("/"); $k=Drupal\Core\DrupalKernel::createFromRequest($r,$a,"prod"); $k->boot(); $k->preHandle($r);
\Drupal::service("account_switcher")->switchTo(\Drupal\user\Entity\User::load(1));
$s=\Drupal::entityTypeManager()->getStorage("workspace");
foreach (["stage" => "Stage", "qa" => "QA review"] as $id => $label) { if (!$s->load($id)) { $s->create(["id" => $id, "label" => $label, "uid" => 1])->save(); } }
echo "workspaces stage and qa ready\n";'
