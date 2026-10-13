# Toki's Skills

用于生成、审查、维护和分发 Codex skills 的合集。GitHub 仓库：**To-k1/tokis-skills**。

目前包含你在「展示型文档skill」中整理的两项能力，角色章程和试用材料从提供的 CLI 整合包原样导入。

| Skill | 用途 |
| --- | --- |
| `technical-deliverable-product-manager` | 主导展示型技术成果交付，协调需求、证据、制作与独立审稿 |
| `reader-facing-document-review` | 对展示型文档先冷读、再核对证据；附带只读审稿 Agent |

## 交互式安装

推荐在终端运行，菜单会让你选择 skill（单个、多选或全部）、项目/用户范围，最后显示安装路径并确认。方向键移动，空格勾选，回车继续，Ctrl+C 取消。

### 使用通用 skills 安装器

与其他 skill 仓库一样，可以直接使用生态中的标准 CLI：

```sh
npx skills@latest add To-k1/tokis-skills
```

它会发现本仓库的两个 skills，并按其交互流程选择 skills、目标工具、范围及安装方式。已实测仓库发现与 skill 列表。参考 [skills 官方项目](https://github.com/vercel-labs/skills)。

通用安装器复制或链接 skill 内容，不会根据本仓库的 skill-extras.json 自动配置 Codex 自定义 Agent。审稿人 skill 中的 setup/reader_doc_reviewer.toml 仍可按其安装说明手动复制到对应 .codex/agents/ 目录；要通过菜单一起安装该配置，使用下面的专用入口。

### Toki 的 Codex 安装菜单

需要 Node.js 20.12+、npm 和 Git。当前从 GitHub 分发，无需先发布 npm。

```sh
npx --allow-git=all github:To-k1/tokis-skills#main
```

无参数即打开菜单：

1. 选择「全部安装」，或勾选需要的单个/多个 skill。
2. 选择「当前项目」或「当前用户的所有项目」。
3. 选中审稿人时，选择是否安装配套 Codex Agent 配置。
4. 查看安装路径并确认执行。

目标工具固定为 Codex。项目范围进入当前目录的 .agents/skills/，用户范围进入 ~/.agents/skills/。Agent 配置进入对应范围的 .codex/agents/reader_doc_reviewer.toml，不修改 config.toml。菜单中取消不会开始安装。

本机 npm 12 默认禁用 Git 来源，所以专用入口为本次运行添加 --allow-git=all，不改变全局配置。旧 npm 若不认识该参数可以省略。参见 [npm 官方说明](https://docs.npmjs.com/cli/v12/using-npm/config/#allow-git)。通用入口从 npm 注册表获取 skills CLI，不需要此参数。

克隆后也可以运行菜单：

```sh
git clone https://github.com/To-k1/tokis-skills.git
cd tokis-skills
npm ci --ignore-scripts
node bin/tokis-skills.js
```

菜单使用 [Clack](https://github.com/bombshell-dev/clack)，不需要 Python。依赖装好后本地复制过程不联网，也不自动下载第三方 skill。

### 脚本与自动化

需要自动化时仍可指定名称或 --all，无需进入菜单：

```sh
node bin/tokis-skills.js list
node bin/tokis-skills.js install reader-facing-document-review
node bin/tokis-skills.js install --all --scope user
```

--project-dir 指定目标项目；--dry-run 预览；--check 比对安装内容；--no-agent 跳过 Agent 配置。没有交互终端且未指定安装项时会提示使用名称或 --all，不会自动安装全部。

重复安装内容相同则跳过；有变化则先将整份旧 skill 放到 .agents/skill-backups/，旧 Agent 配置放到 .codex/agent-backups/，再安装新版。备份保留本地修改和已移除文件，可按输出路径找回。

正式发布后可用版本 tag 或提交 SHA 固定 GitHub 包版本；#main 用于获取当前分支。如果 npm 缓存仍返回旧版，可改用具体提交 SHA。

## 使用

Codex 可从 `.agents/skills/` 发现 skills；如果没有出现，重启 Codex。产品经理运行在当前主 Agent，审稿人需要实际独立线程；安装检查不代表已经实测模型行为。

```text
$technical-deliverable-product-manager
请根据这个项目的真实资料，制作给非技术评委看的成果展示报告。

$reader-facing-document-review
请独立审查这份成果报告，先冷读成稿，再核对目标与技术证据。
```

产品经理单独安装时，CLI 会提示配套审稿 skill，但不会把“单个安装”变成自动安装全部。需要完整流程时安装两项或使用 `--all`。

产品经理需要重大需求澄清时使用原作者 `grilling`，本仓库不复制或重新实现它。按照原整合包提供的入口安装：

```sh
npx skills@latest add mattpocock/skills --skill grilling
```

按第三方安装器的提示选择 Codex 与相同使用范围；其实际可用名称和版本以原作者仓库为准。

## 新增与审查 skill

在本仓库根目录运行：

```sh
node bin/tokis-skills.js create my-skill --description "处理什么任务，在什么场景使用"
# 编辑 skills/my-skill/SKILL.md，补充实际内容和资源
node bin/tokis-skills.js review my-skill
npm run validate
npm test
```

`create` 生成草稿骨架，不调用模型生成正文。请用 Codex 的 `$skill-creator` 结合实际任务完善草稿，再按 [skill 审查说明](docs/skill-review.md) 验证行为。`review` 检查命名、元数据、本地 Markdown 链接和附带 Agent 必填字段；它不替代内容审查，也不是完整 YAML/TOML 解析器。本仓库约定 `name` 和 `description` 为单行 YAML 字符串。

每个 `skills/<name>/SKILL.md` 自动进入列表和 `--all` 安装，不必修改 CLI。`skill-extras.json` 仅记录可选显示名称、配套 skill、外部依赖和附带 Agent 配置相对路径。需要附带 Agent 时，写 `agents: ["setup/xxx.toml"]`；配置使用独立文件，安装时复制到 `.codex/agents/`。

GitHub Actions 会在 push/PR 时运行结构检查、CLI 测试，并检查 npm 打包内容。后续步骤见 [GitHub 与 npm 发布教程](docs/github-and-npm.md)。

## 来源与授权

导入源是用户提供的「技术成果交付_CodexCLI_一键安装整合包」，原始 README 作为历史资料保存在 [docs/source-package.md](docs/source-package.md)，其中旧 Python 安装命令不适用于本仓库。角色章程保持原文，未将附带文档中的指令作为本次建库任务的授权。

当前尚未指定开源许可证，`package.json` 使用 `UNLICENSED`；GitHub 可公开展示，授权复用范围应在选定许可证后明确。第三方 skill 按原作者许可使用。

安装目录和 Agent 文件格式参考 [Codex skills 官方文档](https://learn.chatgpt.com/docs/build-skills) 与 [subagents 官方文档](https://learn.chatgpt.com/docs/agent-configuration/subagents)；npx 用法参考 [npm exec 文档](https://docs.npmjs.com/cli/v11/commands/npm-exec/)。
