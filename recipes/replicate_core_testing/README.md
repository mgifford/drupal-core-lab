# Recipe: Replicate core testing environment

Composite recipe that builds a **rich, reproducible baseline** for testing Drupal core
patches. It is applied on top of a `standard` install and exposes site elements so UI and
form behavior (sidebar / advanced group, media, comments, moderation, etc.) can be
exercised robustly.

> Note: this recipe lives in `core/recipes/` on purpose. The Drupal recipe resolver only
> searches `core/recipes/` for dependencies, so a composite recipe that reuses core
> recipes must live there (a project-level `recipes/` file cannot resolve `core:*` deps).

## What it enables
- `default_admin` theme installed and set as the **administration (backend) theme**.
- Core recipes layered on top of standard (see `core/recipes/`): `comment_base`,
  `tags_taxonomy`, `editorial_workflow`, `image_media_type`, `audio_media_type`,
  `document_media_type`, `remote_video_media_type`, `local_video_media_type`,
  `user_picture`, `basic_html_format_editor`, `full_html_format_editor`,
  `restricted_html_format`, `basic_block_type`, `standard_responsive_images`.

That exposes: comments, taxonomy, image/audio/document/video media + Media Library,
content moderation workflow, multiple text formats, user pictures, responsive images.

## Use it
The reset script applies this automatically. To apply manually on a fresh standard site:
```bash
ddev exec drush site:install standard -y
ddev exec drush recipe core/recipes/replicate_core_testing
ddev drush uli
```

## Extend it
Add another core recipe to the `recipes:` list (unprefixed names) and re-bake the
baseline: `ddev reset-site --capture`.
