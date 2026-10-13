# GitHub 建库、推送与 npx 发布

展示名是 **Toki's Skills**，仓库名为 `tokis-skills`，当前远程地址为 `https://github.com/To-k1/tokis-skills.git`。

## 第一次建库

1. 登录 GitHub，打开 https://github.com/new。
2. Owner 选择 `To-k1`，Repository name 填 `tokis-skills`，Description 可填 `Toki's Skills — Codex skill collection and installer`。
3. 供其他人公开安装时选择 Public。
4. 不勾选 README，不选择 `.gitignore` 或 License。本地已有前两项，许可证之后确定。
5. 点击 Create repository，复制 HTTPS 地址。

## 将本地项目放入 Git

在 Windows PowerShell 中：

```powershell
Set-Location 'D:\Share\code\skill-gen'
git init -b main
git config user.name 'To-k1'
git config user.email '你的 GitHub 邮箱或 noreply 邮箱'
git add .
git diff --cached --stat
git commit -m 'feat: bootstrap Toki skills collection and installer'
git remote add origin https://github.com/To-k1/tokis-skills.git
git push -u origin main
```

如果本项目已经初始化和提交，就跳过对应步骤。`git remote -v` 查看远程；已存在 origin 时用 `git remote set-url origin ...`。提交身份只为当前项目设置。不要在远程 URL 中放 token。

Git for Windows 通常通过 Git Credential Manager 打开 GitHub 登录页面。若当前运行环境无法交互登录，在你自己的终端运行 `git push -u origin main` 完成登录。GitHub HTTPS 不接受账号密码作为 Git 密码；也可按官方文档使用 GitHub CLI 或 PAT。

若出现 `Failed to connect to 127.0.0.1 port 7897`，说明本机 Git 配了代理，但该端口没有服务。启动实际使用的代理；或在能直连 GitHub 的网络下临时运行 `git -c http.proxy= push -u origin main`。不要仅为这个项目随意覆盖全局网络设置。

仓库已有远程提交时先 `git fetch origin` 并检查历史，合并需要保留的内容，再推送；不使用 force push 覆盖远程内容。

## 日常维护

```sh
npm run validate
npm test
git add skills/ skill-extras.json README.md
git diff --cached
git commit -m "feat: add a new skill"
git push
```

首次验证整个项目或修改 CLI 时，按实际变更 `git add` 对应文件。每次加入 skill，都要对触发条件、引用资源与真实工作行为做内容审查，见 [审查说明](skill-review.md)。CI 的结构检查不意味着 AI 行为已经验收。

## GitHub 分发与 npm 分发

GitHub push 后即可运行 `npx skills@latest add To-k1/tokis-skills` 使用通用安装菜单，或运行 `npx --allow-git=all github:To-k1/tokis-skills#main` 使用带 Codex Agent 配置的专用菜单。npm 12 默认禁用 Git 来源，`--allow-git=all` 仅为这次运行允许 Git 下载，不改变全局配置；旧版本若不认识此参数可省略。通过 npm 注册表发布后，才可以使用简短的 `npx tokis-skills@latest ...` 命令。两者是不同的发布渠道，push 不会自动发布 npm。

发布前先决定许可证及 npm 包名归属。`tokis-skills` 是否空闲需用 `npm view tokis-skills name` 检查；如果已被占用，使用你拥有的 npm scope，例如 `@你的npm用户名/tokis-skills`，并同步修改 `package.json` 和安装示例。GitHub 用户名不等于 npm 用户名。

在你自己的终端中：

```sh
npm login
npm whoami
npm run validate
npm test
npm pack --dry-run
# 确认包名、版本、许可证和打包内容后，公开发布：
npm publish --access public
```

npm 发布是外部操作，这份教程不代表本次已经发布。按照 npm 当前登录流程完成浏览器登录/双因素验证。无 scope 的包发布后：

```sh
npx tokis-skills@latest
# 默认打开交互安装菜单；自动化时才添加 install 等参数
```

使用 scope 时，例如包名是 `@example/tokis-skills`，命令变为 `npx @example/tokis-skills@latest`；可执行文件名仍为 `tokis-skills`。

版本 `0.1.0` 可在确认首版可交付后打 tag：

```sh
git tag v0.1.0
git push origin v0.1.0
```

后续更新可以使用 `npm version patch`（先保证工作区干净）、`git push --follow-tags`，再发布新版本。当前 CI 只做验证，不配置自动 npm 发布。

参考：[GitHub 建库](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository)、[添加本地代码](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)、[npm package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)、[npm exec](https://docs.npmjs.com/cli/v11/commands/npm-exec/)。
