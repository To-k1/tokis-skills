# 面向读者的技术成果审稿 Skill｜v3.1

这是可独立安装的**审稿** Skill，不是主产品经理角色，也不是工程执行人格。它基于此前的 `reader-facing-document-review` 入口升级，**保留 Skill 名称**，以便沿用已有调用方式。

## 文件

- `SKILL.md`：审稿入口，独立审稿、冷读、证据对照、处理意见的轻量流程。
- `references/reviewer-charter.md`：完整审稿人 v3.1 角色章程；这是内容判断的核心。
- `references/handoff-template.md`：**冷读结束后**才交接的意图与依据提纲。
- `setup/reader_doc_reviewer.toml`：可选自定义只读子 Agent 配置；**已内嵌 v3.1 全文**，避免相对路径加载问题。

## 安装

1. 将本 `reader-facing-document-review` 文件夹放入项目 `.agents/skills/` 或用户目录 `~/.agents/skills/`，保留文件夹与 `SKILL.md` 的相对结构。
2. 若使用 Codex 自定义子 Agent，把 `setup/reader_doc_reviewer.toml` **复制**到项目 `.codex/agents/reader_doc_reviewer.toml` 或用户 `~/.codex/agents/reader_doc_reviewer.toml`。该配置将角色章程内嵌于 `developer_instructions`，不用猜测子 Agent 的工作目录。
3. 若当前环境不支持委派子 Agent，Skill 必须明确说明审稿未独立执行；不得用同一线程扮演角色冒充真实独立审稿。

## 单独审稿

> 请使用 `$reader-facing-document-review` 独立审查我这份面向评委的技术成果报告。审稿人先仅凭成稿及阅读场景记录冷读印象，再阅读我提供的原始技术依据和展示目的。重点关注真正的成果是否清晰可信，有没有技术归属和成熟度的错位；不要为了审稿制造无关修改。

## 与产品经理 Skill 配合

若同时安装 `technical-deliverable-product-manager`，主 Agent 应使用**产品经理** Skill 主导新交付任务，并在适当阶段委派本 Skill/`reader_doc_reviewer`。审稿人保持独立性，不直接决定项目定位、不亲自改写 Word/PDF/PPT、不接管用户访谈。

`grilling`/`grill-me` **不包含在本压缩包**；需求澄清由产品经理按其真实可用的 Skill 处理。

## 概念性验收

- 不因“不要宣传 DeepSeek”而抹掉真实使用 DeepSeek 的事实；也不因品牌真实出现就认定它一定是项目核心贡献。
- 可以识别“全篇技术上准确、却把关键业务成果埋没”的情况，也可以允许已经恰当的成品直接定稿。
- 能够指出读者印象风险的证据，而不声称自己真的测试过目标读者。
- 对已确认的核心 P0 不建议直接定稿；证据仍不足时写清楚待核实范围。
