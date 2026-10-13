# 面向真实读者的技术成果交付 — Codex CLI 安装包

这个包包含两个独立的 Codex Skills 和一个真正的 Codex 自定义只读审稿子 Agent 配置。**产品经理是当前 Codex 主 Agent 的 Skill，不是新的子 Agent。** 工程执行仍然由 Codex 默认能力承担。

本安装包从原 **产品经理 v1.1 / 审稿人 v3.1** 整合，角色章程及测试材料保持原样，仅在产品经理 Skill 入口补充了 CLI 环境中加载 `grilling` 的方法。

## 快速安装（下载 ZIP 后先解压）

在解压得到的 `codex-technical-deliverables-cli` 目录中打开终端：

**macOS / Linux:**

```sh
bash install.sh --scope user
```

**Windows PowerShell**（需安装 Python 3）：

```powershell
py -3 .\install.py --scope user
```

若已配置 Python，也可在任意平台使用 `python3 install.py --scope user`（Windows 常用 `python` 或 `py -3`）。脚本无第三方 Python 依赖，无网络调用。

如果只想安装到一个项目而非当前用户：

```sh
bash install.sh --scope project --project-dir "/path/to/project"
```

PowerShell 对应：

```powershell
py -3 .\install.py --scope project --project-dir "C:\path\to\project"
```

安装前预览：`python3 install.py --scope user --dry-run`；验证安装：`python3 install.py --scope user --check`。Windows 相应将 `python3` 改为 `py -3`。重新运行安装命令可更新；**有差异的旧文件会先备份，不会直接丢弃用户修改。** 不会改动 `config.toml`。

## 安装了什么

全局安装的目标：

```text
~/.agents/skills/
├── technical-deliverable-product-manager/
│   ├── SKILL.md
│   ├── references/product-manager-charter.md
│   └── tests/...
└── reader-facing-document-review/
    ├── SKILL.md
    ├── references/reviewer-charter.md
    ├── references/handoff-template.md
    └── setup/reader_doc_reviewer.toml

~/.codex/agents/
└── reader_doc_reviewer.toml
```

项目安装则把上述路径改为 `<项目>/.agents/skills` 和 `<项目>/.codex/agents`。`reader_doc_reviewer.toml` 的 `developer_instructions` **内嵌完整审稿章程**，避免相对路径和线程间角色缺失；`sandbox_mode = "read-only"`，但真实会话的权限覆盖依旧可能影响子 Agent，应以当前运行时权限为准。

## 外部依赖 `grilling`（不捆绑、不重新定义）

产品经理在需要澄清重大需求取舍时，默认采用现有的 `grilling` Skill。请检查是否已经安装；未安装时，在终端运行：

```sh
npx skills@latest add mattpocock/skills --skill grilling
```

然后按提示选择 Codex，并选择与本包一致的使用范围。要从用户端手动开始 `grill-me`，还可**另行**安装它，但请确保底层的 `grilling` 也存在：

```sh
npx skills@latest add mattpocock/skills --skill grill-me
```

这里 `--skill grilling` 是两个独立参数。**在 Codex CLI 无 `Skill` 工具时，产品经理应直接读取已安装 `grilling/SKILL.md`，依照原作者说明执行，不得仅宣称已调用。** 这份整合包不联网下载第三方 Skill。若缺失，产品经理需如实说明，不能假装已使用。

## 使用方式

打开或重启 Codex CLI，输入 `/skills` 检查已发现的 Skills，然后在任务中指定：

```text
$technical-deliverable-product-manager
请根据这个项目的真实技术资料，制作给非技术评委看的成果展示报告。先确定成果定位与证据边界；在成品接近完成后调用独立审稿人，核查读者看到的真实价值。
```

单独审稿：

```text
$reader-facing-document-review
请让 reader_doc_reviewer 独立审查这份现有成果报告，先冷读成稿，再核对我的目标与技术证据；不要改写文件，只返回重要问题和是否可以定稿。
```

产品经理 Skill 运行在**当前主 Agent**；`reader_doc_reviewer` 是独立审稿的自定义子 Agent。若当前 Codex 无法真正创建子线程，必须据实说明，不能用主线程假扮独立审稿。

## 安装前后验证范围

- 包内 `SKILL.md` 元数据和两份角色章程、TOML 完整性可以离线验证。
- 安装脚本可在隔离的临时用户目录／项目目录进行全局与项目安装、更新备份、`--check` 和 `--dry-run` 测试。
- **安装检查不等于真实 Codex 模型端到端运行**。第一次实测仍应核实 Skills 被发现、子 Agent 实际出现、先冷读后核对是否真的分两轮，以及审稿建议有无被重新退化成机械关键词修改。

## 目录说明

`skills/` 下的两个 Skill 目录可以分开使用。`agents/reader_doc_reviewer.toml` 是需要复制到 Codex Agent 配置目录的文件。`tests/` 里的虚构测试案例仅供试用评估，不应作为项目材料或标准答案直接注入被测角色。
