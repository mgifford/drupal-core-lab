# Related: MR !16520 / #3557245 and the ID source for error association

Read-only review, 2026-11-26. **No comment was posted and nothing was changed upstream.**

## What the active MR does

MR [!16520](https://git.drupalcode.org/project/drupal/-/merge_requests/16520) (`3557245-inline-form-use-attribute-id`,
opened 2026-08-02, head `4627ee3491`, mergeable, last pipeline success with warnings) changes
`core/modules/inline_form_errors/src/FormErrorHandler.php`:

```php
// before
$has_id = !empty($form_element['#id']);
$url = Url::fromRoute('<none>', [], ['fragment' => $form_element['#id'], 'external' => TRUE]);
// after
$id = $form_element['#attributes']['id'] ?? $form_element['#id'] ?? NULL;
$has_id = !empty($id) || $id !== 0;
$url = Url::fromRoute('<none>', [], ['fragment' => $id, 'external' => TRUE]);
```

It prefers `#attributes['id']` over `#id` for the summary-link fragment, which is the right direction: some
elements render an ID that differs from `#id` (the file upload `--upload` suffix is the reported case).

## The bug in it

`$has_id = !empty($id) || $id !== 0;` is **always true**:

| `$id` | `!empty($id)` | `$id !== 0` | result |
|---|---|---|---|
| `NULL` | false | **true** | true |
| `''` | false | **true** | true |
| `0` | true | false | true |
| `'edit-x'` | true | true | true |

An element with neither an attribute ID nor `#id` therefore still gets a summary link, with a `NULL` fragment.
The intent was presumably `$id !== NULL && $id !== ''` (or `!empty($id) || $id === 0`). Worth fixing in that MR
rather than inheriting it.

## Why it matters here

The association and the summary link must resolve the **same** ID. Today:

- #3083103's proposals derive the error-container ID and the ARIA reference from `#id`.
- !16520 derives the link fragment from `#attributes['id'] ?? #id`.

Once !16520 lands, an element whose rendered ID is `#attributes['id']` would have its summary link point at
the real element while its `aria-errormessage` points at `#id--error-message`, which would not exist. That is a
new dangling reference introduced by landing one without the other.

## Recommendation

1. **Settle the ID source first**: either land !16520 with the `$has_id` fix, or resolve it in the same change
   as the association.
2. **One resolver, three consumers**: the error container ID, the control's `aria-errormessage` /
   `aria-describedby`, and the summary link should all come from one helper (for example
   `FormElementHelper::getElementId($element)`), not three copies of `??`.
3. **Resolve it at the same lifecycle point** as link generation (`handleFormErrors()`), because
   `#attributes['id']` can be set later by a `#pre_render` callback. Radios are the case to watch: at error
   time their `#attributes['id']` is not yet `#id--wrapper`, so the resolver returns `#id` — which is what the
   summary link and the form-element error container both use, and it is correct.
4. Until that is settled, the #3083103 acceptance test should keep asserting **IDREF resolution** (not a
   particular ID string), so it survives either resolution.

## Status of this note

Source-only. The MR's pipeline was green with warnings at its last run (2026-11-06); its review threads were not
read (GitLab API returns 401 for the discussions endpoint). No comment was posted, no change was made.
