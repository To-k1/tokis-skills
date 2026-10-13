import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { exists, filesIn, inside } from './catalog.js';

export async function assertNoSymlink(target) {
  let current = path.resolve(target);
  while (true) {
    if (await exists(current) && (await fs.lstat(current)).isSymbolicLink()) {
      throw new Error(`目标包含符号链接，请选择实际目录: ${current}`);
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

export async function equivalent(source, target) {
  if (!await exists(target)) return false;
  const sourceStat = await fs.lstat(source);
  const targetStat = await fs.lstat(target);
  if (targetStat.isSymbolicLink() || sourceStat.isDirectory() !== targetStat.isDirectory()) return false;
  if (sourceStat.isFile()) return (await fs.readFile(source)).equals(await fs.readFile(target));
  const a = await filesIn(source);
  const b = await filesIn(target);
  if (JSON.stringify(a) !== JSON.stringify(b)) return false;
  for (const file of a) {
    if (!(await fs.readFile(path.join(source, file))).equals(await fs.readFile(path.join(target, file)))) return false;
  }
  return true;
}

export function plan(skills, { scope = 'project', projectDir = process.cwd(), home = os.homedir(), noAgent = false } = {}) {
  if (!['project', 'user'].includes(scope)) throw new Error('--scope 必须是 project 或 user');
  const base = path.resolve(scope === 'user' ? home : projectDir);
  const result = [];
  for (const skill of skills) {
    result.push({ source: skill.dir, target: path.join(base, '.agents', 'skills', skill.name), backupRoot: path.join(base, '.agents', 'skill-backups') });
    if (!noAgent) for (const agent of skill.agents ?? []) {
      result.push({ source: inside(skill.dir, agent), target: path.join(base, '.codex', 'agents', path.basename(agent)), backupRoot: path.join(base, '.codex', 'agent-backups') });
    }
  }
  const targets = result.map(item => item.target);
  if (new Set(targets).size !== targets.length) throw new Error('多个 skill 指向相同安装目标');
  return result;
}

async function copyItem(item, log) {
  const { source, target, backupRoot } = item;
  await fs.mkdir(path.dirname(target), { recursive: true });
  const stage = await fs.mkdtemp(path.join(path.dirname(backupRoot), '.install-'));
  const staged = path.join(stage, path.basename(target));
  let backup;
  try {
    await fs.cp(source, staged, { recursive: true, force: false, errorOnExist: true });
    if (await exists(target)) {
      await fs.mkdir(backupRoot, { recursive: true });
      backup = path.join(backupRoot, `${path.basename(target)}-${Date.now()}-${randomUUID()}`);
      await fs.rename(target, backup);
      log(`[backup] ${backup}`);
    }
    try { await fs.rename(staged, target); }
    catch (error) {
      if (backup) await fs.rename(backup, target);
      throw error;
    }
    log(`[installed] ${target}`);
  } finally {
    await fs.rm(stage, { recursive: true, force: true });
  }
}

export async function install(items, { dryRun = false, check = false, log = console.log } = {}) {
  if (dryRun && check) throw new Error('--dry-run 与 --check 不能同时使用');
  // Validate the complete plan before copying any skill.
  for (const item of items) {
    await assertNoSymlink(item.target);
    await assertNoSymlink(item.backupRoot);
    if (!await exists(item.source)) throw new Error(`安装包缺失: ${item.source}`);
    await filesIn(item.source);
    const relative = path.relative(item.source, item.target);
    if (!relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))) {
      throw new Error('安装目标不能位于源 skill 目录内');
    }
  }
  let ok = true;
  for (const item of items) {
    const same = await equivalent(item.source, item.target);
    if (check) { log(`[${same ? 'OK' : 'MISSING/DIFFERENT'}] ${item.target}`); ok &&= same; }
    else if (same) log(`[current] ${item.target}`);
    else if (dryRun) log(`[would install; existing copy will be backed up] ${item.target}`);
    else await copyItem(item, log);
  }
  return ok;
}
