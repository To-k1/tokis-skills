import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../lib/catalog.js';
import { plan } from '../lib/install.js';
import { chooseInstall } from '../lib/interactive.js';

function promptAnswers(answers) {
  const respond = async () => {
    assert.ok(answers.length, 'unexpected extra prompt');
    return answers.shift();
  };
  return {
    intro() {}, note() {}, cancel() {}, isCancel: value => typeof value === 'symbol',
    multiselect: respond, select: respond, confirm: respond
  };
}

test('menu can select one skill, user scope, and omit its Agent configuration', async () => {
  const skills = await catalog();
  const choice = await chooseInstall(skills, {}, {
    ui: promptAnswers([['reader-facing-document-review'], 'user', false, true]),
    cwd: '/test/project', home: '/test/home'
  });
  assert.deepEqual(choice.chosen.map(skill => skill.name), ['reader-facing-document-review']);
  assert.equal(choice.scope, 'user');
  assert.equal(choice.noAgent, true);
  assert.equal(plan(choice.chosen, { ...choice, home: '/test/home' }).length, 1);
});

test('all menu option selects every skill and includes the Codex Agent', async () => {
  const skills = await catalog();
  const choice = await chooseInstall(skills, {}, {
    ui: promptAnswers([['*'], 'project', true, true]), cwd: '/test/project'
  });
  assert.equal(choice.chosen.length, skills.length);
  const items = plan(choice.chosen, { ...choice, projectDir: '/test/project' });
  assert.equal(items.length, skills.length + 1);
  assert.ok(items.some(item => item.target.endsWith('reader_doc_reviewer.toml')));
});

test('cancelling any menu or declining confirmation returns no installation', async () => {
  const skills = await catalog();
  const cancel = Symbol('cancel');
  for (const answers of [
    [cancel],
    [['*'], cancel],
    [['*'], 'project', cancel],
    [['*'], 'project', true, cancel],
    [['*'], 'project', true, false]
  ]) {
    assert.equal(await chooseInstall(skills, {}, { ui: promptAnswers(answers) }), null);
  }
});

test('preview respects explicit scope and does not ask for install confirmation', async () => {
  const skills = await catalog();
  const choice = await chooseInstall(skills, { global: true, noAgent: true, dryRun: true }, {
    ui: promptAnswers([['*']])
  });
  assert.equal(choice.scope, 'user');
  assert.equal(choice.noAgent, true);
});
