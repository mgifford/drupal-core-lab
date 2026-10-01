// Shared steps for the #3619127 walkthrough scripts (steps 6 to 9 of the issue's steps to reproduce).
export async function setup(page, base) {
  await page.goto(`${base}/node/add/article`);
  await page.locator('.meta-sidebar__trigger').click();                 // 6 open the sidebar
  await page.locator('#edit-path-0 > summary').click();                 // 7 open "URL alias"
  await page.locator('[name="path[0][alias]"]').fill('no-slash');       //   invalid alias
  await page.locator('.meta-sidebar__trigger').click();                 // 8 close the sidebar
  await page.locator('#edit-submit').click();                           // 9 Save
  const link = page.locator('a[href$="#edit-path-0-alias"]').first();
  await link.waitFor({ state: 'visible', timeout: 15000 });
  return link;
}
