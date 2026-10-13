# 面向读者的技术成果交付｜产品经理主 Skill v1.1

这个 Skill 将**当前面向用户的 Codex 主 Agent** 置于“成果交付产品经理”的位置，而不是新增一个只向父 Agent 回报的产品经理子 Agent。工程工作由 Codex 现有工具和可用执行子 Agent 负责；独立审稿由配套的 `reader-facing-document-review` 负责。

## 文件

- `SKILL.md`：产品经理主入口与协作边界。
- `references/product-manager-charter.md`：完整产品经理 v1.1 角色章程。
- `tests/paired-cases.md`：正反配对案例及期望行为，**不要直接提供给被测 Agent 作为任务提示**。
- `tests/README-试用建议.md`：如何检验真实行为、避免“背标准答案”。
- `tests/sample-A.md`、`tests/sample-B.md`、`tests/sample-facts.md`：虚构测试用成稿和核实材料，绝对不能混入真实项目。

## 安装

将整个 `technical-deliverable-product-manager` 文件夹复制到项目 `.agents/skills/` 或用户 `~/.agents/skills/`。建议同时安装配套的审稿 Skill 和可选自定义只读子 Agent。

完整协作推荐：

1. **主 Agent** 激活 `$technical-deliverable-product-manager`，调查项目、确定交付目标。
2. 若存在实质性未决取舍，按**已安装**的 `grilling` Skill 的现有说明澄清；用户主动使用 `/grill-me` 时遵循原始入口。不重写访谈方法，不把每次任务强制变成提问。
3. 借助 Codex 原有工程能力制作文档。
4. 在正式交付前，按需要调用 `$reader-facing-document-review`，由独立审稿者先冷读后核查依据。
5. 主 Agent 判断审稿意见、处理重要问题、验收真实成品，合格就停止。

这里的次序是职责关系，不是每次必须严格执行五个仪式。已明确的小修改、无展示目的的内部 API 文档等不适用整套流程。

本包**没有捆绑 `grilling`／`grill-me`**，也没有创建“工程师 Agent”。如果环境未安装相应 Skill/无法独立委派，主 Agent 应如实说明实际使用了什么、未执行什么。

## 建议第一次尝试

> 请使用 `$technical-deliverable-product-manager`，根据我提供的项目代码和资料制作一份面向非技术评委的技术成果展示报告。先理解项目自身贡献和真实验证阶段。可根据证据提出不同于我的展示建议；重大定位分歧按已有 `grilling` Skill 与我讨论。制作后委派独立审稿人冷读并对照技术依据，不要用工程模块清单代替成果展示，也不要把内部核查顾虑机械写进对外正文。

## 不要做的事

- 不把 `tests/paired-cases.md` 的期望答案加到 Agent 的任务提示里。那只会证明它能复述规则。
- 不把示例 DeepSeek 项目当成用户真实项目。
- 不将产品经理主角色误装在 `.codex/agents/` 下，使其变成无权直接与用户沟通的子 Agent。
