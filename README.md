# dsh-romantic

DeepSeek Harness（DSH）插件市场索引，遵循 **format 1** 规范。`index.json` 就是索引本体，
DSH 的「插件 → 发现（Discover）」可以直接读取它。

## 在 DSH 里使用

**插件 → 发现 → 索引源 → 添加**，粘贴：

```
https://cdn.jsdelivr.net/gh/Yanguan619/dsh-romantic@main/index.json
```

推荐用 jsDelivr：带 CDN 缓存，国内可直连。备用地址（需要能直连 GitHub）：

```
https://raw.githubusercontent.com/Yanguan619/dsh-romantic/main/index.json
```

索引源会持久保存在 profile 里，重启 DSH 后仍在。

## 收录的插件

| 包名 | 版本 | 来源 |
| --- | --- | --- |
| `dsh-ui-polish` | 0.1.0 | [hiocobueno653-pixel/dsh-ui-polish](https://github.com/hiocobueno653-pixel/dsh-ui-polish) |

`dsh-ui-polish` 的版本钉在提交 `b7210820a18631d8106757f4f6a1456019367cca`，
安装参数由 DSH 生成：`git+https://github.com/hiocobueno653-pixel/dsh-ui-polish.git#b7210820a18631d8106757f4f6a1456019367cca`。

## 新增一条插件

在 `index.json` 的 `plugins` 数组里追加一项：

```json
{
  "name": "@scope/package-name",
  "title": { "en": "...", "zh": "..." },
  "description": { "en": "...", "zh": "..." },
  "author": "owner",
  "repository": { "url": "https://github.com/owner/repo" },
  "metadata": { "category": "ui" },
  "versions": [
    {
      "version": "1.2.3",
      "publishTimestamp": 1794142301,
      "source": {
        "type": "git",
        "url": "https://github.com/owner/repo",
        "commit": "40 位小写 commit SHA"
      },
      "engines": { "dsh": ">=0.2.1" }
    }
  ]
}
```

规则：

- `name` 必须是合法 npm 包名，索引内唯一；`versions` 至少一项。
- `version` 必须是精确 SemVer；`publishTimestamp` 是 Unix 秒；同一插件内版本不得重复。
- Git 源 = `url`（https，无 `.git` 后缀亦可）+ 40 位小写 `commit`；包在子目录时加 `"path": "packages/x"`。
- npm 源写 `"source": { "type": "npm" }`，可选 `"registry": "https://..."`。
- `metadata.category` / `labels` / `sortKeys` 的值必须先在顶层 `metadata` 里声明。
- `engines.dsh` 可省略（不限版本）；写了会参与兼容性判断。

改完提交即可，Discover 里刷新索引就能看到；jsDelivr 有缓存，最新提交可能延迟几分钟生效。
