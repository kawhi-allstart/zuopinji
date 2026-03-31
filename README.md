# Urban Assets Portfolio

一个适合放到 Cloudflare Pages 的静态地产 / 产业园项目作品集。

## 当前结构

- `index.html`：页面结构
- `styles.css`：样式与响应式布局
- `content.js`：站点文案与固定模块配置
- `portfolio-data.js`：由脚本生成的项目数据
- `script.js`：前端渲染与图库交互
- `generate_portfolio_data.py`：扫描 `作品库` 并生成项目数据
- `作品库/`：你的真实项目素材

## 作品库推荐结构

每个项目目录建议逐步整理成：

```text
作品库/
  某项目/
    描述/
      summary.txt
    效果图/
      01.jpg
      02.jpg
    实景/
      01.jpg
      02.jpg
```

当前如果项目目录里还只是根目录图片，脚本也能正常识别。脚本同时兼容：

- `描述` / `文字描述`
- `实景` / `真实照片`

如果你想让页面自动替换更正式的项目标题和摘要，建议在 `描述` 里放一个 `summary.txt` 或 `.md`，内容可以这样写：

```text
标题：仙桃智造产业园
摘要：项目位于……我负责……最终形成……
标签：产业园, 招商展示, 城市更新
```

其中：

- `标题` 会覆盖当前页面上的项目名称
- `摘要` 会覆盖自动生成的说明文字
- `标签` 会追加到项目卡片标签里

## 生成项目数据

每次你往 `作品库` 补完素材后，在当前目录运行：

```powershell
python .\generate_portfolio_data.py
```

这会重新生成：

```text
portfolio-data.js
```

## 本地预览

直接双击 `index.html` 就能看。

如果你想走本地服务预览，也可以运行：

```powershell
python -m http.server 4173
```

然后打开：

```text
http://localhost:4173
```

## 部署到 Cloudflare Pages

1. 把整个目录上传到 GitHub
2. 在 Cloudflare Pages 连接仓库
3. 这是纯静态站，不需要构建命令
4. 发布目录保持仓库根目录即可
5. 绑定自定义域名

## 后续你只需要做两件事

1. 往 `作品库` 继续补 `文字描述 / 效果图 / 真实照片`
2. 补完后重新运行 `python .\generate_portfolio_data.py`
