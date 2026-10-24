# Phase 3: false-positive check

Generated 2026-10-24T01:28:25.869Z by `node scripts/info-yml-repro.mjs false-positives`, with the patched core's `core/scripts/dr ex:validate` (default exclusions: tests/ skipped, as by extension discovery). Machine-readable: [false-positives.json](false-positives.json). **DRAFT until a person has reviewed it.**

Contributed projects come from their GitHub repositories at the commit shown (development branches, not drupal.org release packages, which were unreachable). Every finding is listed, so each can be judged.

Core's counts are of tracked files only: `git status --ignored` listed nothing under core/ (the core commit shown is the parent of the patch commit).

| project | commit | parser | info files | PHP files | errors | warnings | findings by rule |
|---|---|---|---|---|---|---|---|
| [drupal core (the patched checkout)](https://github.com/drupal/drupal) | 89df3a065d | symfony | 76 | 4900 | 0 | 0 | none |
| [drupal core (the patched checkout)](https://github.com/drupal/drupal) | 89df3a065d | pecl | 76 | 4900 | 0 | 0 | none |
| [farmOS/farmOS](https://github.com/farmOS/farmOS) | 441ea6a45f | symfony | 118 | 660 | 0 | 118 | warning info.core_incompatible: 118 |
| [farmOS/farmOS](https://github.com/farmOS/farmOS) | 441ea6a45f | pecl | 118 | 660 | 0 | 118 | warning info.core_incompatible: 118 |
| [goalgorilla/open_social](https://github.com/goalgorilla/open_social) | dc52b9ad97 | symfony | 132 | 1693 | 0 | 139 | warning info.core_incompatible: 132, warning info.deprecated: 1, warning info.base_theme: 1, warning php.deprecated: 5 |
| [goalgorilla/open_social](https://github.com/goalgorilla/open_social) | dc52b9ad97 | pecl | 132 | 1693 | 0 | 139 | warning info.core_incompatible: 132, warning info.deprecated: 1, warning info.base_theme: 1, warning php.deprecated: 5 |
| [localgovdrupal/localgov](https://github.com/localgovdrupal/localgov) | 234bdd5b1d | symfony | 1 | 4 | 0 | 1 | warning info.core_incompatible: 1 |
| [localgovdrupal/localgov](https://github.com/localgovdrupal/localgov) | 234bdd5b1d | pecl | 1 | 4 | 0 | 1 | warning info.core_incompatible: 1 |
| [drupal-graphql/graphql](https://github.com/drupal-graphql/graphql) | a1dc10f8d4 | symfony | 3 | 169 | 0 | 3 | warning info.core_incompatible: 3 |
| [drupal-graphql/graphql](https://github.com/drupal-graphql/graphql) | a1dc10f8d4 | pecl | 3 | 169 | 0 | 3 | warning info.core_incompatible: 3 |
| [Gizra/og](https://github.com/Gizra/og) | 337a922a2b | symfony | 2 | 129 | 0 | 2 | warning info.core_incompatible: 2 |
| [Gizra/og](https://github.com/Gizra/og) | 337a922a2b | pecl | 2 | 129 | 0 | 2 | warning info.core_incompatible: 2 |
| [thunder/thunder-distribution](https://github.com/thunder/thunder-distribution) | d2d2a0a0c0 | symfony | 14 | 96 | 0 | 14 | warning info.core_incompatible: 14 |
| [thunder/thunder-distribution](https://github.com/thunder/thunder-distribution) | d2d2a0a0c0 | pecl | 14 | 96 | 0 | 14 | warning info.core_incompatible: 14 |

## Every finding (Symfony YAML)

### farmOS/farmOS

- `farm.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/animal/farm_animal.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/compost/farm_compost.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/equipment/farm_equipment.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/group/farm_group.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/land/farm_land.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/land/modules/types/farm_land_types.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/material/farm_material.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/plant/farm_plant.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/product/farm_product.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/seed/farm_seed.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/sensor/farm_sensor.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/sensor/modules/listener/farm_sensor_listener.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/structure/farm_structure.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/structure/modules/types/farm_structure_types.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/asset/water/farm_water.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/api/farm_api.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/api/modules/farm_api_default_consumer/farm_api_default_consumer.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/api/modules/farm_api_oauth/farm_api_oauth.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/asset/asset.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/comment/farm_comment.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/comment/modules/asset/farm_comment_asset.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/comment/modules/log/farm_comment_log.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/comment/modules/plan/farm_comment_plan.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/csv/farm_csv.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/data_stream/data_stream.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/data_stream/modules/notification/data_stream_notification.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/entity/farm_entity.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/entity/modules/access/farm_entity_access.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/entity/modules/fields/farm_entity_fields.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/entity/modules/views/farm_entity_views.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/export/farm_export.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/export/modules/csv/farm_export_csv.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/export/modules/kml/farm_export_kml.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/field/farm_field.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/flag/farm_flag.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/form/farm_form.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/format/farm_format.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/geo/farm_geo.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/id_tag/farm_id_tag.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/image/farm_image.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/import/farm_import.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/import/modules/csv/farm_import_csv.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/import/modules/kml/farm_import_kml.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/inventory/farm_inventory.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/kml/farm_kml.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/l10n/farm_l10n.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/location/farm_location.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/log/farm_log.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/log/modules/asset/farm_log_asset.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/log/modules/quantity/farm_log_quantity.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/login/farm_login.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/map/farm_map.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/map/modules/google/farm_map_google.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/map/modules/mapbox/farm_map_mapbox.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/migrate/farm_migrate.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/notification/farm_notification.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/organization/organization.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/owner/farm_owner.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/parent/farm_parent.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/plan/plan.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/quantity/quantity.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/quick/farm_quick.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/report/farm_report.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/role/farm_role.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/role/modules/account_admin/farm_role_account_admin.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/role/modules/roles/farm_role_roles.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/setup/farm_setup.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/test/farm_test.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/timeline/farm_timeline.info.yml:6` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/action/farm_ui_action.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/breadcrumb/farm_ui_breadcrumb.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/dashboard/farm_ui_dashboard.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/farm_ui.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/help/farm_ui_help.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/location/farm_ui_location.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/map/farm_ui_map.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/menu/farm_ui_menu.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/metrics/farm_ui_metrics.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/term/farm_ui_term.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/theme/farm_ui_theme.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/user/farm_ui_user.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/ui/views/farm_ui_views.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/core/update/farm_update.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/activity/farm_activity.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/birth/farm_birth.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/harvest/farm_harvest.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/input/farm_input.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/lab_test/farm_lab_test.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/maintenance/farm_maintenance.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/medical/farm_medical.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/observation/farm_observation.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/seeding/farm_seeding.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/log/transplanting/farm_transplanting.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/organization/farm/farm_farm.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quantity/material/farm_quantity_material.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quantity/standard/farm_quantity_standard.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quantity/test/farm_quantity_test.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quick/birth/farm_quick_birth.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quick/group/farm_quick_group.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quick/inventory/farm_quick_inventory.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quick/movement/farm_quick_movement.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/quick/planting/farm_quick_planting.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/role/account_admin/farm_account_admin.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/role/config_admin/farm_config_admin.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/role/manager/farm_manager.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/role/viewer/farm_viewer.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/role/worker/farm_worker.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/animal_type/farm_animal_type.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/equipment_type/farm_equipment_type.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/lab/farm_lab.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/log_category/farm_log_category.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/material_type/farm_material_type.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/plant_type/farm_plant_type.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/product_type/farm_product_type.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/season/farm_season.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/test_method/farm_test_method.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/taxonomy/unit/farm_unit.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.

### goalgorilla/open_social

- `modules/custom/activity_basics/activity_basics.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_creator/activity_creator.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_logger/activity_logger.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_send/activity_send.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_send/modules/activity_send_email/activity_send_email.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_send/modules/activity_send_push_notification/activity_send_push_notification.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/activity_viewer/activity_viewer.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/alternative_frontpage/alternative_frontpage.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/download_count/download_count.info.yml:8` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/dropdown/dropdown.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/entity_access_by_field/entity_access_by_field.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/group_core_comments/group_core_comments.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/gvbo/gvbo.info.yml:6` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/gvbo/gvbo.info.yml` warning [info.deprecated] Using a non-string as the 'version' value is deprecated in drupal:11.4.0 and will be a fatal error in drupal:13.0.0. Instead, wrap the version value in single quotes. See https://www.drupal.org/node/3576311
- `modules/custom/improved_theme_settings/improved_theme_settings.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/mentions/mentions.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/secret_file_system/secret_file_system.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/sitewide_js/sitewide_js.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_admin_menu/social_admin_menu.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_advanced_queue/social_advanced_queue.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_ajax_comments/social_ajax_comments.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_analytics/social_analytics.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_demo/social_demo.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_eda/social_eda.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^10 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_file_private/social_file_private.info.yml:7` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_font/social_font.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_gdpr/social_gdpr.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_graphql/social_graphql.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_language/modules/social_content_translation/social_content_translation.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_language/social_language.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_lazy_loading/social_lazy_loading.info.yml:6` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_lets_connect/modules/social_lets_connect_contact/social_lets_connect_contact.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_lets_connect/social_lets_connect.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_magic_login/social_magic_login.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_media_system/social_media_system.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_metatag/social_metatag.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_path_manager/social_path_manager.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_queue_storage/social_queue_storage.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/social_react/social_react.info.yml:11` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/custom/template_suggestions_extra/template_suggestions_extra.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_advanced/modules/social_course_advanced_invite/social_course_advanced_invite.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_advanced/modules/social_course_advanced_request/social_course_advanced_request.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_advanced/social_course_advanced.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_basic/modules/social_course_basic_invite/social_course_basic_invite.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_basic/modules/social_course_basic_request/social_course_basic_request.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_basic/social_course_basic.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/modules/social_course_statistics/social_course_statistics.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_course/social_course.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_kpi_lite/modules/social_kpi_lite_tag_followers/social_kpi_lite_tag_followers.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_kpi_lite/modules/social_kpi_lite_tagged_content/social_kpi_lite_tagged_content.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_kpi_lite/modules/social_kpi_lite_user_login/social_kpi_lite_user_login.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/features/social_kpi_lite/social_kpi_lite.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/open_source/signed_file_upload/signed_file_upload.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_activity/modules/social_activity_filter/social_activity_filter.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_activity/social_activity.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_album/social_album.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_book/modules/social_book_featured/social_book_featured.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_book/social_book.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_branding/social_branding.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_comment/social_comment.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_comment_upload/social_comment_upload.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/modules/social_book_content_block/social_book_content_block.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/modules/social_content_block_landing_page/social_content_block_landing_page.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/modules/social_event_content_block/social_event_content_block.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/modules/social_group_content_block/social_group_content_block.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/modules/social_page_content_block/social_page_content_block.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_block/social_content_block.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_content_report/social_content_report.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_core/social_core.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_download_count/social_download_count.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_editor/social_editor.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_email_broadcast/social_email_broadcast.info.yml:10` warning [info.core_incompatible] The core_version_requirement (^10 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_embed/social_embed.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_emoji/social_emoji.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_addtocal/social_event_addtocal.info.yml:3` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_an_enroll/social_event_an_enroll.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_an_enroll_enrolments_export/social_event_an_enroll_enrolments_export.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_enrolments_export/social_event_enrolments_export.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_invite/social_event_invite.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_managers/social_event_managers.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_max_enroll/social_event_max_enroll.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/modules/social_event_type/social_event_type.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_event/social_event.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_featured_content/social_featured_content.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_featured_items/social_featured_items.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_follow_content/social_follow_content.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_follow_taxonomy/modules/social_follow_landing_page/social_follow_landing_page.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_follow_taxonomy/modules/social_follow_tag/social_follow_tag.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_follow_taxonomy/social_follow_taxonomy.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_follow_user/social_follow_user.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_footer/social_footer.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_default_route/social_group_default_route.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_flexible_group/modules/social_flexible_group_book/social_flexible_group_book.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_flexible_group/modules/social_flexible_group_featured/social_flexible_group_featured.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_flexible_group/social_group_flexible_group.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_gvbo/social_group_gvbo.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_invite/social_group_invite.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_members_export/social_group_members_export.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_quickjoin/social_group_quickjoin.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_request/social_group_request.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_secret/modules/social_secret_group_featured/social_secret_group_featured.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_secret/social_group_secret.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/modules/social_group_welcome_message/social_group_welcome_message.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_group/social_group.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_landing_page/social_landing_page.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_like/social_like.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_mentions/social_mentions.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_node/social_node.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_page/social_page.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_post/modules/social_post_album/social_post_album.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_post/modules/social_post_photo/social_post_photo.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_post/social_post.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_private_message/social_private_message.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_affiliation_migrate/social_profile_affiliation_migrate.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_fields/social_profile_fields.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_manager_notes/social_profile_manager_notes.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_organization_tag/social_profile_organization_tag.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_preview/social_profile_preview.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/modules/social_profile_privacy/social_profile_privacy.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_profile/social_profile.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_search/social_search.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_sharing/social_sharing.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_swiftmail/social_swiftmail.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_tagging/social_tagging.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_topic/social_topic.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_user/social_user.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/social_features/social_user_export/social_user_export.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/systems/kpi_analytics/kpi_analytics.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/systems/social_pwa/modules/activity_send_push/activity_send_push.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/systems/social_pwa/social_pwa.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `social.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `themes/socialbase/socialbase.info.yml:31` warning [info.core_incompatible] The core_version_requirement (^8.8 \|\| ^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `themes/socialblue/socialblue.info.yml:8` warning [info.core_incompatible] The core_version_requirement (^8.8 \|\| ^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `themes/socialbase/socialbase.info.yml:27` warning [info.base_theme] The base theme "bootstrap" is not among the checked themes or the themes in core. If it is not installed, every page fails once caches are cleared.
- `modules/social_features/social_group/modules/social_group_invite/social_group_invite.module:251` warning [php.deprecated] Non-canonical cast (integer) is deprecated, use the (int) cast instead
- `modules/social_features/social_group/modules/social_group_invite/social_group_invite.module:280` warning [php.deprecated] Non-canonical cast (integer) is deprecated, use the (int) cast instead
- `modules/social_features/social_user/social_user.install:204` warning [php.deprecated] Non-canonical cast (boolean) is deprecated, use the (bool) cast instead
- `modules/social_features/social_user/social_user.install:243` warning [php.deprecated] Non-canonical cast (boolean) is deprecated, use the (bool) cast instead
- `modules/social_features/social_user/social_user.module:563` warning [php.deprecated] Non-canonical cast (boolean) is deprecated, use the (bool) cast instead

### localgovdrupal/localgov

- `localgov.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.

### drupal-graphql/graphql

- `examples/graphql_composable/graphql_composable.info.yml:8` warning [info.core_incompatible] The core_version_requirement (^10.2 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `examples/graphql_example/graphql_examples.info.yml:8` warning [info.core_incompatible] The core_version_requirement (^10.2 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `graphql.info.yml:6` warning [info.core_incompatible] The core_version_requirement (^10.2 \|\| ^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.

### Gizra/og

- `og.info.yml:5` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `og_ui/og_ui.info.yml:6` warning [info.core_incompatible] The core_version_requirement (^9 \|\| ^10) does not include Drupal 12.0-dev, so the extension cannot be installed on it.

### thunder/thunder-distribution

- `modules/thunder_article/thunder_article.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_gqls/thunder_gqls.info.yml:8` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_ivw/thunder_ivw.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_media/thunder_media.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_news_article/thunder_news_article.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_paragraphs/thunder_paragraphs.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_password_policy/thunder_password_policy.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_search/thunder_search.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_taxonomy/thunder_taxonomy.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_translation/thunder_translation.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_vgwort/thunder_vgwort.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_workflow/thunder_workflow.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `modules/thunder_xymatic/thunder_xymatic.info.yml:4` warning [info.core_incompatible] The core_version_requirement (^11) does not include Drupal 12.0-dev, so the extension cannot be installed on it.
- `thunder.info.yml:5` warning [info.core_incompatible] The core_version_requirement (~11.4.0) does not include Drupal 12.0-dev, so the extension cannot be installed on it.

