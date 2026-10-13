import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { catalog, ROOT, exists, select } from '../lib/catalog.js';
import { install, plan } from '../lib/install.js';

const exec = promisify(execFile);
const pm = 'technical-deliverable-product-manager';
const reviewer = 'reader-facing-document-review';
const silent = () => {};

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tokis-skills-test-'));
  t.after(async () => { await fs.rm(dir, { recursive: true, force: true }); });
  return { dir, skills: await catalog() };
}

test('single install copies only the selected skill; reviewer includes its Agent', async t => {
  const { dir, skills } = await fixture(t);
  await install(plan(select(skills, [reviewer], false), { projectDir: dir }), { log: silent });
  assert.equal(await exists(path.join(dir, '.agents/skills', reviewer, 'SKILL.md')), true);
  assert.equal(await exists(path.join(dir, '.agents/skills', pm)), false);
  assert.equal(await exists(path.join(dir, '.codex/agents/reader_doc_reviewer.toml')), true);
  assert.equal(await exists(path.join(dir, '.codex/config.toml')), false);
});

test('all install and repeat install retain exact contents without backups', async t => {
  const { dir, skills } = await fixture(t);
  const items = plan(skills, { projectDir: dir });
  await install(items, { log: silent });
  assert.equal(await install(items, { check: true, log: silent }), true);
  await install(items, { log: silent });
  assert.equal(await exists(path.join(dir, '.agents/skill-backups')), false);
});

test('update backs up modified and extra files outside the discovery directory', async t => {
  const { dir, skills } = await fixture(t);
  const items = plan(select(skills, [pm], false), { projectDir: dir });
  await install(items, { log: silent });
  const target = items[0].target;
  await fs.writeFile(path.join(target, 'SKILL.md'), 'my edited skill');
  await fs.writeFile(path.join(target, 'user-notes.txt'), 'keep my notes');
  assert.equal(await install(items, { check: true, log: silent }), false);
  await install(items, { log: silent });
  const backups = await fs.readdir(items[0].backupRoot);
  assert.equal(backups.length, 1);
  assert.equal(await fs.readFile(path.join(items[0].backupRoot, backups[0], 'SKILL.md'), 'utf8'), 'my edited skill');
  assert.equal(await fs.readFile(path.join(items[0].backupRoot, backups[0], 'user-notes.txt'), 'utf8'), 'keep my notes');
  assert.equal(await exists(path.join(target, 'user-notes.txt')), false);
  assert.equal(await install(items, { check: true, log: silent }), true);
});

test('dry-run and missing-content check make no writes', async t => {
  const { dir, skills } = await fixture(t);
  const items = plan(skills, { projectDir: dir });
  await install(items, { dryRun: true, log: silent });
  assert.equal(await install(items, { check: true, log: silent }), false);
  assert.deepEqual(await fs.readdir(dir), []);
});

test('user scope and no-agent keep project and config untouched', async t => {
  const { dir, skills } = await fixture(t);
  const project = path.join(dir, 'project');
  const items = plan(skills, { scope: 'user', home: path.join(dir, 'home'), projectDir: project, noAgent: true });
  await install(items, { log: silent });
  assert.equal(await exists(project), false);
  assert.equal(await exists(path.join(dir, 'home/.codex')), false);
  assert.equal(await exists(path.join(dir, 'home/.agents/skills', reviewer, 'SKILL.md')), true);
});

test('invalid selection and incompatible options fail without partial installs', async t => {
  const { dir, skills } = await fixture(t);
  assert.throws(() => select(skills, [pm, 'unknown'], false), /未知 skill/);
  assert.throws(() => select(skills, [pm], true), /同时使用/);
  const cli = path.join(ROOT, 'bin/tokis-skills.js');
  for (const args of [
    ['install', pm, '--all'],
    ['install', '--all', '--scope', 'invalid'],
    ['install', '--all', '--dry-run', '--check'],
    ['install', '--all', '--glboal'],
    ['list', '--global']
  ]) {
    await assert.rejects(exec(process.execPath, [cli, ...args], { cwd: dir }), error => error.code === 1);
  }
  assert.deepEqual(await fs.readdir(dir), []);
});

test('CLI create discovers a new skill and refuses to overwrite it', async t => {
  const { dir } = await fixture(t);
  await fs.mkdir(path.join(dir, 'skills'));
  await fs.writeFile(path.join(dir, 'skill-extras.json'), '{}');
  const cli = path.join(ROOT, 'bin/tokis-skills.js');
  const args = [cli, 'create', 'new-skill', '--description', 'Handle a specific task'];
  await exec(process.execPath, args, { cwd: dir });
  assert.equal((await catalog(dir))[0].name, 'new-skill');
  await assert.rejects(exec(process.execPath, args, { cwd: dir }));
});

test('full preflight prevents a missing Agent from causing a partial install', async t => {
  const { dir, skills } = await fixture(t);
  const items = plan(skills, { projectDir: dir });
  items.at(-1).source = path.join(dir, 'missing-agent.toml');
  await assert.rejects(install(items, { log: silent }), /安装包缺失/);
  assert.deepEqual(await fs.readdir(dir), []);
});
