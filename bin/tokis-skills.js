#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { parseArgs } from 'node:util';
import { ROOT, catalog, select, review, validName, exists } from '../lib/catalog.js';
import { install, plan } from '../lib/install.js';

const help = `Toki's Skills

  tokis-skills list
  tokis-skills install <skill-name> [other-skill-name ...]
  tokis-skills install --all
  tokis-skills review <skill-name> | --all
  tokis-skills create <skill-name> --description "用途和触发场景"

install options:
  --scope project|user   默认 project；user 安装到当前用户目录
  --global               等同 --scope user
  --project-dir PATH     项目目录（默认当前目录）
  --dry-run              预览，不写入
  --check                验证安装内容，不写入
  --no-agent             不复制附带的 Codex Agent 配置

create options:
  --description TEXT     单行描述；在当前仓库 skills/ 中生成草稿

通用: --help, --version
review 只检查结构和本地链接；行为审查使用 docs/skill-review.md。`;

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    all: { type: 'boolean' }, scope: { type: 'string' }, global: { type: 'boolean' },
    'project-dir': { type: 'string' }, 'dry-run': { type: 'boolean' }, check: { type: 'boolean' },
    'no-agent': { type: 'boolean' }, description: { type: 'string' },
    help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'v' }
  } });
  if (values.version) {
    console.log(JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8')).version); return;
  }
  const [command, ...names] = positionals;
  if (values.help || !command) { console.log(help); return; }
  const allowed = {
    list: [], install: ['all', 'scope', 'global', 'project-dir', 'dry-run', 'check', 'no-agent'],
    review: ['all'], create: ['description']
  };
  if (!allowed[command]) throw new Error(`未知命令: ${command}`);
  for (const option of Object.keys(values)) {
    if (!allowed[command].includes(option)) throw new Error(`${command} 不支持 --${option}`);
  }
  if (command === 'create') {
    if (names.length !== 1 || !validName(names[0])) throw new Error('请给出一个小写字母、数字和连字符组成的名称（小于64字符）');
    const description = values.description?.trim();
    if (!description || /[\r\n]/.test(description)) throw new Error('--description 必须是非空单行文本');
    const repo = process.cwd();
    if (!await exists(path.join(repo, 'skill-extras.json'))) throw new Error('请在 tokis-skills 仓库根目录运行 create');
    const dir = path.join(repo, 'skills', names[0]);
    await fs.mkdir(dir); // Deliberately fails if the skill already exists.
    await fs.writeFile(path.join(dir, 'SKILL.md'), `---\nname: ${names[0]}\ndescription: ${JSON.stringify(description)}\n---\n\n# ${names[0]}\n\n<!-- 草稿：补充实际工作流程、所需资源与完成条件后再发布。 -->\n`);
    console.log(`已创建草稿: ${dir}\n完成内容后运行 review，再按 docs/skill-review.md 进行行为审查。`);
    return;
  }
  const skills = await catalog();
  if (command === 'list') {
    if (names.length) throw new Error('list 不接受 skill 名称');
    for (const skill of skills) console.log(`${skill.name}\n  ${skill.title ?? skill.name}\n  ${skill.description}\n`);
    return;
  }
  const chosen = select(skills, names, values.all);
  const reports = await review(chosen);
  for (const report of reports) {
    if (command === 'review') console.log(`[${report.errors.length ? 'FAIL' : 'OK'}] ${report.name} (${report.files} files)`);
    for (const error of report.errors) console.error(`  ${error}`);
  }
  if (reports.some(report => report.errors.length)) { process.exitCode = 1; return; }
  if (command === 'review') {
    console.log('结构检查完成。角色行为、证据边界和独立审稿仍需实际试用。'); return;
  }
  if (values.global && values.scope && values.scope !== 'user') throw new Error('--global 与 --scope project 冲突');
  const scope = values.global ? 'user' : values.scope ?? 'project';
  if (scope === 'user' && values['project-dir']) throw new Error('--project-dir 只适用于 --scope project');
  const items = plan(chosen, { scope, projectDir: values['project-dir'], noAgent: values['no-agent'] });
  if (!await install(items, { dryRun: values['dry-run'], check: values.check })) process.exitCode = 1;
  for (const skill of chosen) {
    for (const companion of skill.companions ?? []) {
      if (!chosen.some(item => item.name === companion)) console.log(`配套 skill（未自动安装）: ${companion}`);
    }
    for (const dependency of skill.externalSkills ?? []) {
      const base = scope === 'user' ? os.homedir() : path.resolve(values['project-dir'] ?? process.cwd());
      const candidates = [path.join(base, '.agents', 'skills', dependency, 'SKILL.md'), path.join(os.homedir(), '.agents', 'skills', dependency, 'SKILL.md')];
      const found = (await Promise.all(candidates.map(exists))).some(Boolean);
      console.log(`${dependency}: ${found ? '已在所查目录找到' : '在所查目录未找到；请按 README 安装原作者版本'}（未自动下载第三方 skill）`);
    }
  }
  if (!values.check && !values['dry-run']) console.log('安装完成。在 Codex 中使用 $skill-name；如未发现请重启 Codex。');
}

main().catch(error => { console.error(`错误: ${error.message}`); process.exitCode = 1; });
