import path from 'node:path';
import os from 'node:os';
import { select } from './catalog.js';
import { plan } from './install.js';

// UI is injectable so tests exercise the install decisions without a real terminal.
export async function chooseInstall(skills, options = {}, {
  ui, cwd = process.cwd(), home = os.homedir()
} = {}) {
  ui ??= await import('@clack/prompts');
  ui.intro("Toki's Skills · Codex 安装");
  const ask = async (method, config) => {
    const answer = await ui[method](config);
    if (ui.isCancel(answer)) throw CANCELLED;
    return answer;
  };
  try {
    const names = await ask('multiselect', {
      message: '选择要安装的 skill（空格勾选，回车继续）',
      options: [
        { value: '*', label: '全部安装', hint: `${skills.length} 个 skills` },
        ...skills.map(skill => ({ value: skill.name, label: skill.title ?? skill.name, hint: skill.name }))
      ],
      required: true
    });
    const chosen = select(skills, names.includes('*') ? [] : names, names.includes('*'));
    const scope = options.global ? 'user' : options.scope ?? (options.projectDir ? 'project' : await ask('select', {
      message: '安装到哪里？',
      options: [
        { value: 'project', label: '当前项目', hint: path.resolve(cwd) },
        { value: 'user', label: '当前用户的所有项目', hint: home }
      ]
    }));
    const withAgent = chosen.some(skill => skill.agents?.length);
    const noAgent = options.noAgent || (withAgent && !await ask('confirm', {
      message: '同时安装审稿人的 Codex Agent 配置？',
      initialValue: true
    }));
    const items = plan(chosen, { scope, projectDir: options.projectDir ?? cwd, home, noAgent });
    const notes = chosen.flatMap(skill => [
      ...(skill.companions ?? []).filter(name => !chosen.some(item => item.name === name)).map(name => `配套 skill（未选中）：${name}`),
      ...(skill.externalSkills ?? []).map(name => `外部依赖：${name}（需另行安装原作者版本）`)
    ]);
    ui.note([...chosen.map(skill => skill.title ?? skill.name), '', ...items.map(item => item.target), ...notes].join('\n'), '安装预览');
    if (!options.dryRun && !options.check && !await ask('confirm', { message: '确认安装？', initialValue: true })) {
      ui.cancel('已取消，未安装');
      return null;
    }
    return { chosen, scope, noAgent };
  } catch (error) {
    if (error !== CANCELLED) throw error;
    ui.cancel('已取消，未安装');
    return null;
  }
}

const CANCELLED = Symbol('cancelled');
