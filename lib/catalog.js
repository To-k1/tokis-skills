import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const validName = name => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) && name.length < 64;

export async function exists(file) {
  try { await fs.lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export function inside(base, relative) {
  const result = path.resolve(base, relative);
  const rel = path.relative(base, result);
  if (!rel || rel.startsWith('..' + path.sep) || rel === '..' || path.isAbsolute(rel)) {
    throw new Error(`路径必须位于 ${base} 内: ${relative}`);
  }
  return result;
}

// The catalog accepts a documented subset: name and description are single-line YAML scalars.
export function frontmatter(text) {
  const header = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!header) throw new Error('SKILL.md 缺少 YAML frontmatter');
  const result = {};
  for (const key of ['name', 'description']) {
    const value = header[1].match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1].trim();
    if (!value || /^[>|]/.test(value)) throw new Error(`${key} 必须是非空单行字符串`);
    if (value.startsWith('"')) result[key] = JSON.parse(value);
    else if (value.startsWith("'")) {
      if (!value.endsWith("'")) throw new Error(`${key} 引号未闭合`);
      result[key] = value.slice(1, -1).replaceAll("''", "'");
    } else result[key] = value;
  }
  return result;
}

export async function filesIn(dir, prefix = '') {
  const stat = await fs.lstat(dir);
  if (stat.isSymbolicLink()) throw new Error(`源文件不支持符号链接: ${dir}`);
  if (stat.isFile()) return [prefix];
  const files = [];
  for (const item of await fs.readdir(dir, { withFileTypes: true })) {
    const relative = path.join(prefix, item.name);
    if (item.isSymbolicLink()) throw new Error(`源文件不支持符号链接: ${relative}`);
    if (item.isDirectory()) files.push(...await filesIn(path.join(dir, item.name), relative));
    else if (item.isFile()) files.push(relative);
  }
  return files.sort();
}

export async function catalog(root = ROOT) {
  const extras = JSON.parse(await fs.readFile(path.join(root, 'skill-extras.json'), 'utf8'));
  const result = [];
  for (const entry of await fs.readdir(path.join(root, 'skills'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, 'skills', entry.name);
    const meta = frontmatter(await fs.readFile(path.join(dir, 'SKILL.md'), 'utf8'));
    if (!validName(meta.name) || meta.name !== entry.name) throw new Error(`skill 名称与目录不一致: ${entry.name}`);
    result.push({ ...extras[meta.name], ...meta, dir });
  }
  if (!result.length) throw new Error('skills/ 没有可安装的 skill');
  for (const name of Object.keys(extras)) {
    if (!result.some(skill => skill.name === name)) throw new Error(`skill-extras.json 引用了不存在的 skill: ${name}`);
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function select(skills, names, all) {
  if (all && names.length) throw new Error('--all 与单个 skill 名称不能同时使用');
  if (!all && !names.length) throw new Error('请指定 skill 名称，或使用 --all');
  return all ? skills : [...new Set(names)].map(name => {
    const skill = skills.find(item => item.name === name);
    if (!skill) throw new Error(`未知 skill: ${name}，使用 list 查看名称`);
    return skill;
  });
}

export async function review(skills) {
  const reports = [];
  for (const skill of skills) {
    const errors = [];
    const files = await filesIn(skill.dir);
    for (const file of files.filter(file => file.endsWith('.md'))) {
      const text = await fs.readFile(path.join(skill.dir, file), 'utf8');
      for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const link = match[1].replace(/^<|>$/g, '').split('#')[0];
        if (!link || /^[a-z][a-z\d+.-]*:/i.test(link) || link.startsWith('/')) continue;
        const dest = path.resolve(path.dirname(path.join(skill.dir, file)), decodeURIComponent(link));
        if (!await exists(dest)) errors.push(`${file}: 链接不存在 ${link}`);
      }
    }
    for (const agent of skill.agents ?? []) {
      const source = inside(skill.dir, agent);
      if (!await exists(source)) errors.push(`缺少 Agent 配置: ${agent}`);
      else {
        const text = await fs.readFile(source, 'utf8');
        for (const key of ['name', 'description', 'developer_instructions']) {
          if (!new RegExp(`^${key}\\s*=`, 'm').test(text)) errors.push(`${agent}: 缺少 ${key}`);
        }
      }
    }
    reports.push({ name: skill.name, files: files.length, errors });
  }
  return reports;
}
