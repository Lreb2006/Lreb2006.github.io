好的，小白同学你好！这篇教程会一步一步带你用 MkDocs 框架搭建个人博客，部署到 GitHub Pages，通过 GitHub Actions 实现自动化部署，并用 Cloudflare 设置 DNS，让你（以及在有网络权限的情况下）内网的朋友也能访问你的博客。我们会讲得非常详细，跟着做就好啦！ ((20250527001039-c25u13r "*"))

**整体流程概览：**

1. **本地搭建 (MkDocs)** ：在你的电脑上安装 MkDocs，创建博客项目，写文章，本地预览效果。
2. **代码托管 (GitHub)** ：将你的博客项目代码上传到 GitHub 仓库。
3. **博客上线 (GitHub Pages)** ：利用 GitHub Pages 的免费服务，将你的博客发布到互联网上。
4. **自动更新 (GitHub Actions)** ：设置 GitHub Actions，让你每次在本地写完文章推送到 GitHub 后，博客能自动更新，无需手动操作。
5. **域名访问与加速 (Cloudflare)** ：如果你有自己的域名（比如 `yourname.com`），可以通过 Cloudflare 解析到你的 GitHub Pages 博客，并可能获得加速和安全防护。这样，只要有网络连接，内网外网都能通过域名访问。

**你需要准备：**

- 一台电脑 (Windows, macOS, Linux 都可以)
- 一点点耐心和探索精神
- 一个 GitHub 账号 (没有的话去 [https://github.com/](https://github.com/) 注册一个)
- 一个 Cloudflare 账号 (没有的话去 [https://www.cloudflare.com/](https://www.cloudflare.com/) 注册一个)
- (可选) 一个你自己的域名 (比如 `yourname.com`，如果暂时没有，也可以先用 GitHub 提供的免费二级域名)

好，我们开始吧！

---

**第一步：在你的电脑上用 MkDocs 搭建博客框架**

MkDocs 是一个用 Python 语言写的工具，它可以把我们用 Markdown 写的普通文本文件，转换成漂亮的静态网页博客。

1. **安装 Python 和 pip**

    - MkDocs 需要 Python 环境。如果你的电脑还没有安装 Python，请先去 Python 官网 ([https://www.python.org/downloads/](https://www.python.org/downloads/)) 下载并安装最新稳定版的 Python。安装时记得勾选 "Add Python to PATH" 或类似选项。
    - pip 是 Python 的包管理工具，一般安装 Python 时会自动安装。你可以打开命令行工具（Windows 用户搜 "cmd" 或 "PowerShell"，macOS/Linux 用户搜 "Terminal"）输入以下命令检查：

      ```bash
      python --version
      pip --version
      ```

      如果能显示版本号，说明安装成功。
2. **安装 MkDocs 和 Material 主题**

    - 继续在命令行中输入以下命令来安装 MkDocs 和一个非常流行的主题 "Material for MkDocs"：

      ```bash
      pip install mkdocs mkdocs-material
      ```
    - 等待安装完成。
3. **创建你的第一个博客项目**

    - 在命令行中，进入你想要存放博客代码的文件夹（比如 `D:\MyBlog` 或者 `~/Projects/MyBlog`）。可以使用 `cd` 命令切换目录，例如：

      ```bash
      cd D:\MyBlog
      ```
    - 然后运行以下命令创建一个新的博客项目，我们给它取名叫 `my-awesome-blog` (你可以换成你喜欢的名字)：

      ```bash
      mkdocs new my-awesome-blog
      ```
    - 这时，在你的文件夹下会多出一个 `my-awesome-blog` 的子文件夹，里面就是你的博客项目了。
4. **认识你的博客项目结构**

    - 进入项目文件夹：

      ```bash
      cd my-awesome-blog
      ```
    - 你会看到主要有两个东西：

      - `mkdocs.yml`：这是你博客的配置文件，非常重要！网站名字、主题、导航栏等等都在这里设置。
      - `docs/` 文件夹：这里面放你的所有 Markdown 文章。默认会有一个 `index.md`，它就是你博客的首页。
5. **配置你的博客 (编辑** **`mkdocs.yml`** **)**

    - 用你喜欢的文本编辑器（比如 VS Code, Sublime Text, Notepad++，甚至记事本）打开 `mkdocs.yml` 文件。
    - 修改它，至少改一下网站名字：

      ```yaml
      site_name: 我的第一个博客  # 把这里改成你想要的博客名字
      # 你也可以现在就指定使用 Material 主题
      theme:
        name: material
      ```
    - 保存文件。
6. **写下你的第一篇文章**

    - 在 `docs/` 文件夹里，你可以直接修改 `index.md`，或者新建一个 `.md` 文件，比如 `about.md`。
    - 用 Markdown 语法写文章。Markdown 很简单，比如：

      ```markdown
      # 这是一级标题

      大家好，这是我的第一篇博客文章！

      ## 这是一个二级标题

      * 列表项1
      * 列表项2
      ```
7. **在本地预览你的博客**

    - 在命令行中，确保你仍然在 `my-awesome-blog` 项目文件夹内。
    - 运行以下命令启动一个本地服务器来预览你的博客：

      ```bash
      mkdocs serve
      ```
    - 命令行会显示一个地址，通常是 `http://127.0.0.1:8000/`。在你的浏览器里打开这个地址，就能看到你的博客啦！
    - 你在 `docs/` 文件夹里修改并保存 Markdown 文件，或者修改 `mkdocs.yml` 并保存，浏览器里的页面会自动刷新，非常方便。
    - 预览满意后，在命令行按 `Ctrl+C` 停止本地服务器。

---

**第二步：将你的博客代码上传到 GitHub**

现在你的博客在本地已经能跑起来了，接下来我们要把它放到 GitHub 上，这样 GitHub Pages 才能访问到它。

1. **在 GitHub 上创建新仓库 (Repository)**

    - 登录你的 GitHub 账号。
    - 点击页面右上角的 "+" 号，选择 "New repository"。
    - **Repository name (仓库名称)** ：

      - **如果你想用** **`你的用户名.github.io`** **作为博客地址**：仓库名必须严格设置为 `你的GitHub用户名.github.io`。例如，如果你的 GitHub 用户名是 `octocat`，那么仓库名就是 `octocat.github.io`。
      - **如果你想用** **`你的用户名.github.io/仓库名`** **作为博客地址**：仓库名可以任意取，比如 `my-blog-project`。
    - **Description (描述)** ：选填，可以写 "My personal blog powered by MkDocs"。
    - **Public / Private (公开/私有)** ：选择 "Public"，因为 GitHub Pages 的免费服务通常需要公开仓库（对于个人账户）。
    - **Initialize this repository with (用以下内容初始化仓库)** ：暂时不要勾选任何东西（比如 README, .gitignore, license）。
    - 点击 "Create repository"。
2. **将本地博客项目与 GitHub 仓库关联并推送**

    - 回到你的电脑命令行，确保你仍然在 `my-awesome-blog` 项目文件夹内。
    - **初始化 Git 仓库** (如果你的项目还不是一个 Git 仓库的话)：

      ```bash
      git init
      ```
    - **添加远程仓库地址** (GitHub 创建仓库后会显示这个地址，通常以 `.git` 结尾)：

      ```bash
      git remote add origin https://github.com/你的GitHub用户名/你的仓库名.git
      ```

      例如：`git remote add origin https://github.com/octocat/octocat.github.io.git`
    - **添加所有文件到暂存区**：

      ```bash
      git add .
      ```
    - **提交更改**：

      ```bash
      git commit -m "Initial commit: My first blog content"
      ```
    -  **(重要) 重命名默认分支为** **`main`** (GitHub 现在推荐使用 `main` 作为主分支名，以前是 `master`)：

      ```bash
      git branch -M main
      ```
    - **推送到 GitHub 远程仓库**：

      ```bash
      git push -u origin main
      ```

      这可能需要你输入 GitHub 的用户名和密码（或者 Personal Access Token）。

现在，刷新你的 GitHub 仓库页面，就能看到你的 `mkdocs.yml` 和 `docs/` 文件夹等已经上传上去了。

---

**第三步：通过 GitHub Pages 发布你的博客**

GitHub Pages 是 GitHub 提供的一项免费服务，可以直接从你的 GitHub 仓库托管静态网站。

1. **(可选，但推荐) 本地部署到** **`gh-pages`** **分支**

    - MkDocs 有一个方便的命令可以直接将构建好的静态网页推送到 GitHub 仓库的一个特殊分支 `gh-pages`，GitHub Pages 会自动从这个分支读取并展示网页。
    - 在你的命令行，确保在 `my-awesome-blog` 项目文件夹内，运行：

      ```bash
      mkdocs gh-deploy --clean
      ```

      这个命令会：

      1. 构建你的 MkDocs 项目，生成 HTML 文件 (通常在 `site` 文件夹里，但你不用管它)。
      2. 将这些 HTML 文件推送到一个名为 `gh-pages` 的新分支（如果不存在的话）。

      - `--clean` 参数会确保每次部署前清除旧的 `gh-pages` 分支内容。
2. **设置 GitHub Pages 的源**

    - 回到你的 GitHub 仓库页面。
    - 点击仓库上方的 "Settings" (设置) 选项卡。
    - 在左侧导航栏找到 "Pages" (通常在 "Code and automation" 分组下)。
    - 在 "Build and deployment" (构建和部署) 部分：

      - **Source (源)** ：选择 "Deploy from a branch" (从分支部署)。
      - **Branch (分支)** ：

        - 选择 `gh-pages` 分支。
        - 文件夹通常选择 `/(root)`。
        - 点击 "Save"。
3. **等待博客上线**

    - 保存设置后，GitHub Pages 会开始部署你的网站。页面上会显示你的博客网址。
    - 如果是 `用户名.github.io` 这种仓库，网址就是 `https://用户名.github.io/`。
    - 如果是项目仓库 (比如 `my-blog-project`)，网址会是 `https://用户名.github.io/my-blog-project/`。
    - 第一次部署可能需要几分钟。你可以刷新 GitHub Pages 的设置页面查看状态，或者直接尝试访问你的博客网址。

如果一切顺利，你现在应该能通过 GitHub 提供的网址看到你的博客了！

---

**第四步：使用 GitHub Actions 实现自动化部署**

现在每次你更新博客，都需要手动运行 `mkdocs gh-deploy`。我们可以用 GitHub Actions 来实现：当你把本地的修改（比如新文章）推送到 GitHub 的 `main` 分支后，GitHub Actions 会自动帮你运行构建和部署命令。

1. **在你的博客项目中创建 GitHub Actions 工作流文件**

    - 在你的本地 `my-awesome-blog` 项目文件夹里，创建一个新文件夹路径：`.github/workflows` (注意 `.` 开头)。
    - 在 `workflows` 文件夹里，创建一个 YAML 文件，比如叫 `ci.yml` (或者 `deploy.yml`，名字不重要，后缀是 `.yml` 或 `.yaml`)。
2. **编辑** **`ci.yml`** **文件**

    - 用文本编辑器打开 `ci.yml`，粘贴以下内容：

    ```yaml
    name: Deploy MkDocs Blog # 工作流的名字，随便取

    on:
      push: # 触发条件：当有代码推送到...
        branches:
          - main # ...main 分支时触发 (如果你的主分支是 master，就写 master)
      pull_request: # 当有 Pull Request 到 main 分支时也触发 (可选)
        branches:
          - main

    jobs:
      deploy:
        runs-on: ubuntu-latest # 使用最新的 Ubuntu 系统作为运行环境
        steps:
          - name: Checkout code # 第一步：拉取你的仓库代码
            uses: actions/checkout@v4 # 使用官方的 checkout 动作

          - name: Set up Python # 第二步：设置 Python 环境
            uses: actions/setup-python@v5
            with:
              python-version: '3.x' # 使用 Python 3.x 版本

          - name: Install dependencies # 第三步：安装 MkDocs 和主题
            run: |
              pip install mkdocs mkdocs-material
              # 如果你用了其他 MkDocs 插件，也在这里安装，例如：
              # pip install mkdocs-git-revision-date-localized-plugin

          - name: Deploy to GitHub Pages # 第四步：部署
            run: |
              mkdocs gh-deploy --force --clean --verbose
              # --force 是必需的，因为 Action 是在一个干净的环境中运行
              # --clean 清理旧的 gh-pages 分支
              # --verbose 显示更详细的日志，方便排错
    ```

    **重要配置说明：**

    - `on.push.branches`: 确保这里写的是你推送代码的那个主分支名 (通常是 `main` 或 `master`)。
    - `python-version`: 可以指定更具体的版本，比如 `3.11`。
    - `pip install ...`: 如果你还用了 MkDocs 的其他插件（比如显示最后修改时间的插件），也需要在这里用 `pip install` 安装它们。
3. **提交并推送 Actions 配置文件**

    - 回到命令行，在 `my-awesome-blog` 项目文件夹内：

      ```bash
      git add .github/workflows/ci.yml
      git commit -m "Add GitHub Actions workflow for automatic deployment"
      git push origin main
      ```
4. **检查 GitHub Actions 运行情况**

    - 推送到 GitHub 后，去你的 GitHub 仓库页面。
    - 点击上方的 "Actions" 选项卡。
    - 你会看到一个名为 "Deploy MkDocs Blog" (或者你 `ci.yml` 里 `name` 指定的名字) 的工作流正在运行，或者已经运行完毕。
    - 你可以点击进去查看每一步的执行日志。如果看到绿色的勾，说明执行成功！红色的叉则表示失败，你需要查看日志找出原因。

现在，每当你修改了本地的博客内容 (比如在 `docs/` 文件夹里添加或修改了 `.md` 文件)，然后执行以下 Git 命令：

```bash
git add .
git commit -m "写了新文章：XXX"
git push origin main
```

GitHub Actions 就会自动检测到 `main` 分支有更新，然后自动帮你运行 `mkdocs gh-deploy` 命令，更新你发布在 GitHub Pages 上的博客！是不是很酷？

---

**第五步：使用 Cloudflare 设置 DNS (让内网也能访问你的自定义域名博客)**

如果你拥有自己的域名 (比如 `mycoolblog.com`)，并且想用这个域名访问你的博客，而不是用 GitHub 提供的 `用户名.github.io` 地址，那么你可以使用 Cloudflare 来管理你域名的 DNS。

**关于 "内网也可以访问"：** 
通常，GitHub Pages 部署的博客是公开在互联网上的。通过 Cloudflare 设置 DNS 后，只要你的设备能连接互联网，无论是在家、在公司（内网）、在咖啡馆，都可以通过你的域名访问。这里假设的 "内网也可以访问" 指的是在公司或学校等内网环境中，只要该内网允许访问外部互联网，就能访问到你的博客。如果你的意思是想把博客部署成一个 *仅限特定内网访问* 的私有站点，那么 GitHub Pages 和 Cloudflare (公开 DNS) 的组合可能不是最直接的方案，那需要更复杂的内网部署策略。我们这里讲的是公开博客的内网访问。

1. **在 Cloudflare 添加你的域名**

    - 登录你的 Cloudflare 账号。
    - 点击 "Add a Site" (添加站点)，输入你的域名 (比如 `mycoolblog.com`)，然后点击 "Add site"。
    - Cloudflare 会让你选择一个套餐，选择免费 (Free) 套餐即可，然后点击 "Continue"。
    - Cloudflare 会扫描你域名当前的 DNS 记录。如果你的域名是新注册的，可能什么都没有。
2. **配置 DNS 记录指向 GitHub Pages**

    - Cloudflare 扫描完成后，会显示你当前的 DNS 记录（如果之前有过设置）。我们需要添加或修改记录，使其指向你的 GitHub Pages 博客。
    - **你需要知道你的 GitHub Pages 地址**：

      - 如果是 `用户名.github.io` 仓库，地址是 `用户名.github.io`。
      - 如果是项目仓库 (如 `my-blog-project`)，地址是 `用户名.github.io` (注意，这里不是 `用户名.github.io/my-blog-project/`，CNAME 指向的是用户或组织的 GitHub Pages 主机名)。
    - **添加 CNAME 记录：**

      - 点击 "Add record" (添加记录)。
      - **Type (类型)** ：选择 `CNAME`。
      - **Name (名称)** ：

        - 如果你想用 `www.mycoolblog.com` 访问博客，就填 `www`。
        - 如果你想用顶级域名 `mycoolblog.com` 直接访问，Cloudflare 通常允许你为根域名（@）设置 CNAME (这叫 CNAME flattening 或 ANAME)。如果可以，Name 填 `@`。
      - **Target (目标)** ：填你的 GitHub Pages 主机名，即 `你的GitHub用户名.github.io`。(注意，**不要**加 `https://`，也不要加后面的仓库名路径)。
      - **TTL (生存时间)** ：可以保持默认的 "Auto"。
      - **Proxy status (代理状态)** ：建议保持橙色的云朵 (Proxied)，这样可以享受 Cloudflare 的 CDN 加速和一些安全防护。
      - 点击 "Save"。
    - **(可选) 为根域名设置 (如果上面 CNAME 的 Name 填的是** **`www`** **):**

      - 如果你希望用户输入 `mycoolblog.com` (不带 `www`) 也能访问，并且你的 `www.mycoolblog.com` 已经设置好了。你可以：

        - **方法一 (推荐，如果 Cloudflare 支持根域名的 CNAME flattening)** ：像上面一样，再添加一个 CNAME 记录，Type 选 `CNAME`，Name 填 `@`，Target 填 `你的GitHub用户名.github.io`。
        - **方法二 (如果 Cloudflare 不支持根域名 CNAME 或你想用 A 记录)** ：GitHub Pages 也提供了一些固定的 IP 地址给 Apex domains (根域名)。你可以在 GitHub Pages 的文档里找到这些 IP。然后添加多个 `A` 记录，Name 填 `@`，Content/Value 分别填入 GitHub Pages 提供的那些 IP 地址。

          - 查阅 GitHub Pages 关于自定义域名的文档获取最新 IP 地址。
        - **方法三 (使用 Page Rule 重定向)** : 你可以设置一个 A 记录让 `@` 指向一个虚拟 IP (比如 `192.0.2.1`，这是一个文档用 IP)，然后用 Cloudflare 的 Page Rule 将 `mycoolblog.com/*` 301 重定向到 `https://www.mycoolblog.com/$1`。
    - **清理其他可能冲突的记录**：如果你域名之前有指向其他服务器的 A 记录或 CNAME 记录 (比如指向你旧的虚拟主机)，并且现在不用了，最好删除它们，以避免冲突。
3. **在 GitHub Pages 设置中添加自定义域名**

    - 回到你的 GitHub 仓库页面。
    - 点击 "Settings" -> "Pages"。
    - 在 "Custom domain" (自定义域名) 部分：

      - 输入你的完整自定义域名 (比如 `www.mycoolblog.com` 或者 `mycoolblog.com`，取决于你 Cloudflare 里是怎么设置的)。
      - 点击 "Save"。
    - GitHub 可能会检查你的 DNS 设置。如果 DNS 配置正确，它会尝试为你的自定义域名启用 HTTPS。
    - **重要**：如果你的仓库是项目仓库 (不是 `用户名.github.io`)，并且你配置了自定义域名 (比如 `blog.yourdomain.com`)，GitHub Pages 通常会自动处理路径。但有时，你可能需要在 `mkdocs.yml` 中配置 `site_url` 为你的自定义域名，例如：

      ```yaml
      site_url: https://www.mycoolblog.com/ # 如果你的博客在 www.mycoolblog.com
      # 或者 site_url: https://blog.yourdomain.com/your-repo-name/ # 如果你的博客在自定义域名的子路径下
      ```

      不过，对于直接映射到 GitHub Pages 的自定义域名，通常不需要在 `site_url` 中添加子路径。`mkdocs gh-deploy` 会处理好。
4. **更新 Cloudflare 的域名服务器 (Nameservers)**

    - 当你完成 DNS 记录设置后，Cloudflare 会给你两个它自己的域名服务器地址 (比如 `ada.ns.cloudflare.com` 和 `ben.ns.cloudflare.com`)。
    - 你需要去你购买域名的那个网站（域名注册商，比如 GoDaddy, Namecheap, 阿里云，腾讯云等），登录你的账户，找到你这个域名的管理界面，修改它的域名服务器 (Nameservers 或 DNS Servers) 为 Cloudflare 提供的那两个地址。
    - 这个修改过程因域名注册商而异，通常在 "DNS Management" 或 "Nameserver Settings" 类似的地方。
    - 保存更改。域名服务器的更新在全球生效可能需要几小时到48小时不等，但通常很快。
5. **检查 HTTPS/SSL 设置 (在 Cloudflare)**

    - 在 Cloudflare 的仪表盘，选择你的域名。
    - 转到 "SSL/TLS" 选项卡。
    - 确保 SSL/TLS 加密模式至少是 "Full" (如果 GitHub Pages 端也启用了 HTTPS，并且证书有效)。"Full (Strict)" 更安全，它会验证源服务器 (GitHub Pages) 的 SSL 证书。GitHub Pages 通常会自动提供 SSL 证书。
    - 通常 Cloudflare 会自动为你的域名启用 HTTPS。

**等待 DNS 生效**

- 域名服务器和 DNS 记录的更改都需要时间在全球的 DNS 系统中传播。耐心等待一段时间。
- 你可以用一些在线的 DNS Checker工具来查看你的域名解析是否已经指向了 Cloudflare 以及 GitHub Pages。
- 一旦生效，你应该就可以通过你的自定义域名 `https://www.mycoolblog.com` (或者你设置的域名) 访问你的博客了！并且由于 Cloudflare 的 CDN，全球访问速度可能会有所提升，同时也有基础的 DDoS 防护。

---

**总结一下，你现在拥有了：**

- 一个用 MkDocs 搭建的、可以用 Markdown 轻松写作的本地博客。
- 一个托管在 GitHub 上的博客代码仓库。
- 一个通过 GitHub Pages 发布的、公开的在线博客。
- 一个通过 GitHub Actions 实现的、推送代码后自动更新博客的自动化流程。
- (如果配置了) 一个通过 Cloudflare 解析的、使用你自定义域名的、可能还带有 HTTPS 和 CDN 加速的博客。

**后续可以探索的：**

- **更换或自定义 MkDocs 主题**：Material for MkDocs 主题本身就有很多自定义选项，你可以在 `mkdocs.yml` 的 `theme` 部分进行配置。也可以找找其他 MkDocs 主题。
- **使用 MkDocs 插件**：比如社交分享按钮、评论系统 (如 Gitalk, Disqus，需要额外配置)、统计分析 (如 Google Analytics) 等。
- **学习更多 Markdown 语法**：让你的文章更丰富。
- **优化** **`mkdocs.yml`** **配置**：比如添加导航栏、页脚等。

搭建个人博客是一个很有趣的过程，希望这篇超详细的教程能帮到你！如果在过程中遇到任何问题，别灰心，尝试搜索错误信息，或者回顾一下每一步的操作。祝你玩得开心！