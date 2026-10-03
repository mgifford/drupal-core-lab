# Setup building blocks (prototype)

A chat assistant cannot know how to configure Drupal for a given core, and in our tests it never did so reliably. So an issue pack does not ask it to write recipe files. It picks **blocks** from this folder:

    setup:
      - use: file_field_with_size_limit
        params: { field: attachment, limit: "1 KB" }
    needs:                      # optional: things the assistant wishes the catalogue had
      - block: ckeditor5_toolbar_item
        why: "the scenario needs a toolbar button added to a text format"

`node scripts/issue-pack.mjs import` expands the blocks into the same `recipes/repro_<nid>/` files as a hand-written recipe (a block can require another, which is added automatically). A pack uses either `setup` or `recipe`, not both; `recipe` stays for people who know the configuration.

| Block | Adds | Parameters |
|---|---|---|
| `article_content_type` | the Article content type (the Standard install of current core does not create it) | none |
| `image_media_type` | an Image media type and the media library views | none |
| `file_field_with_size_limit` | an optional file field on the Article form with a size limit and allowed extensions (once per pack) | `field`, `label`, `limit`, `extensions` |

## Adding a block

Copy a block file, change it, and open a pull request. A block is one YAML file named `<name>.yml` with:

- `name` (equal to the file name), `title`, `description` (what it adds, in plain words; the chat prompt shows it to the assistant, so do not claim more than the block does);
- `params`: each with a `type` (`machine_name`, `text`, `size`, `extensions`; each is a strict pattern, so a value cannot add YAML), a `default` and a `description`;
- `requires` (other blocks), `once: true` if two copies cannot coexist;
- `recipe` (`recipes`, `install`, `config_actions`) and `files` (`config/<name>.yml`), with `{{param}}` placeholders;
- **`verified`**: say where the block was actually applied (the core commit and which build). A block nobody has applied does not belong here, and the catalogue refuses to load without this field.

Check it with `node --test tests/issue-pack/blocks.test.mjs`. The tests refuse a block with an undeclared placeholder, a missing requirement, a cycle or a file name outside `config/`, and they compare the expansions of the current blocks with recipes that were verified on real core.

## Limits of the prototype

Two copies of the same block need the same configuration action with different arguments, so a block can be marked `once`. Blocks that edit the same configuration object differently conflict, and the importer says so instead of picking one. Scenario steps and checks are still written by the assistant; only the setup is a menu so far.
