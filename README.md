# Toki's Skills

用于生成、审查、维护和分发 Codex skills 的合集。GitHub 仓库：**To-k1/tokis-skills**。

目前包含你在「展示型文档skill」中整理的两项能力，角色章程和试用材料从提供的 CLI 整合包原样导入。

| Skill | 用途 |
| --- | --- |
| `technical-deliverable-product-manager` | 主导展示型技术成果交付，协调需求、证据、制作与独立审稿 |
| `reader-facing-document-review` | 对展示型文档先冷读、再核对证据；附带只读审稿 Agent |

## 安装

需要 Node.js 20+ 和 npm。当前先通过 GitHub 分发，**无需先发布到 npm**。以下命令需仓库已推送、网络可访问 GitHub；从 GitHub 安装也需要 Git。

在要使用 skill 的项目目录中运行：

```sh
# 查看可用 skill
npx --yes --package=github:To-k1/tokis-skills tokis-skills list

# 单个安装：产品经理
npx --yes --package=github:To-k1/tokis-skills tokis-skills install technical-deliverable-product-manager

# 单个安装：审稿人（自动复制配套 Agent 配置）
npx --yes --package=github:To-k1/tokis-skills tokis-skills install reader-facing-document-review

# 全部安装
npx --yes --package=github:To-k1/tokis-skills tokis-skills install --all

# 安装到当前用户，供所有项目使用
npx --yes --package=github:To-k1/tokis-skills tokis-skills install --all --global
```

默认安装到当前项目 `.agents/skills/`。`--global`（或 `--scope user`）安装到 `~/.agents/skills/`。审稿人的 Agent 配置同时进入对应范围的 `.codex/agents/reader_doc_reviewer.toml`。不修改 `config.toml`；`--no-agent` 可以跳过 Agent 配置。

`--project-dir "路径"` 指定另一项目；`--dry-run` 预览；`--check` 检查目标内容是否与本包一致，缺失或不同会返回非零退出码。重复安装内容相同则跳过；有变化则先将整份旧 skill 放到 `.agents/skill-backups/`，旧 Agent 配置放到 `.codex/agent-backups/`，再安装新版。备份保留本地修改和已移除文件，可按输出路径找回。

正式版本可以将 `github:To-k1/tokis-skills` 改为 `github:To-k1/tokis-skills#v0.1.0`（先创建该 tag）。开发期间需要获取最新提交时，在包地址后加 `#main`；如果仍命中 npm 缓存，用具体提交 SHA 固定版本。

也可以先克隆，再离线安装：

```sh
git clone https://github.com/To-k1/tokis-skills.git
cd tokis-skills
node bin/tokis-skills.js list
node bin/tokis-skills.js install --all --project-dir "你的项目路径"
```

CLI 没有运行时第三方依赖，不需要 Python，不在安装过程中下载其他 skill。

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
