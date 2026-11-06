// A cached, empty `apt-get update` layer makes the add-on's chromium install fail; setup.mjs then rebuilds with no cache.
//   node --test tests/lab/ddev-build-failure.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { isStaleAptCache, ADDON_VERSION } from '../../tools/compare/ddev-build-failure.mjs';
import { parseChromiumDockerfile, latestTag } from '../../tools/compare/pins.mjs';

const DOCKERFILE = `RUN echo "deb http://snapshot.debian.org/archive/debian/20260210T000000Z/ bookworm main" > /etc/apt/sources.list && \\
    echo "deb http://snapshot.debian.org/archive/debian-security/20260210T000000Z/ bookworm-security main" >> /etc/apt/sources.list
RUN apt-get install -y --no-install-recommends \\
    chromium=143.0.7499.169-1~deb12u1 \\
    chromium-common=143.0.7499.169-1~deb12u1 \\
    # These are the specific libraries your error mentioned
    libdav1d6 \\
    && rm -rf /var/lib/apt/lists/*
RUN apt-get install -y xvfb libnss3`;

const STALE = `Failed to start repro-baseline-3615469: docker-compose build failed: Dockerfile:51
failed to solve: process "/bin/bash -c apt-get install -y --no-install-recommends     chromium=143.0.7499.169-1~deb12u1" did not complete successfully: exit code: 100
#15 0.652 E: Version '143.0.7499.169-1~deb12u1' for 'chromium' was not found
#15 0.652 E: Unable to locate package libdav1d6`;

test('the empty-apt-cache failure is recognised', () => {
  assert.equal(isStaleAptCache(STALE), true);
});

test('other start failures are not mistaken for it', () => {
  assert.equal(isStaleAptCache('ddev-router failed to become ready'), false);
  assert.equal(isStaleAptCache("Failed to start x: docker-compose build failed: Dockerfile:9\nE: Unable to locate package foo"), false);
  assert.equal(isStaleAptCache(''), false);
  assert.equal(isStaleAptCache(undefined), false);
});

test('the add-on is pinned to a release tag', () => {
  assert.match(ADDON_VERSION, /^v\d+\.\d+\.\d+$/);
});

test('pins are read from the add-on Dockerfile: snapshot sources and the chromium install block only', () => {
  const p = parseChromiumDockerfile(DOCKERFILE);
  assert.deepEqual(p.sources, ['deb http://snapshot.debian.org/archive/debian/20260210T000000Z/ bookworm main', 'deb http://snapshot.debian.org/archive/debian-security/20260210T000000Z/ bookworm-security main']);
  assert.deepEqual(p.packages, ['chromium=143.0.7499.169-1~deb12u1', 'chromium-common=143.0.7499.169-1~deb12u1', 'libdav1d6']);
});

test('a source or package that is not plain data is dropped, and a Dockerfile without pins is refused', () => {
  const evil = DOCKERFILE.replace('libdav1d6', '$(touch /tmp/x)').replace('deb http://snapshot.debian.org/archive/debian/', 'deb http://evil.example/archive/debian/');
  const p = parseChromiumDockerfile(evil);
  assert.equal(p.sources.length, 1);
  assert.ok(!p.packages.some((x) => x.includes('$')));
  assert.throws(() => parseChromiumDockerfile('FROM scratch'), /changed shape/);
});

test('the newest release tag is found by number, not by text', () => {
  assert.equal(latestTag(['v1.2.5', 'v1.10.0', 'v1.2.40', 'nightly']), 'v1.10.0');
  assert.equal(latestTag([]), null);
});
