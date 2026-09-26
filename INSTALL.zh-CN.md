# Stan 简体中文安装指南

## 推荐：从浏览器官方商店安装

- [在 Chrome 网上应用店安装 Stan](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif)
- [在 Mozilla Firefox Add-ons 安装 Stan](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/)

官方商店会为对应浏览器管理扩展更新。若你需要检查安装包，或 Chrome 网上应用店无法访问，可继续阅读下面的 Chrome 手动安装备用指南。

## Chrome 手动安装（备用）

本指南使用与 Chrome provider 验证并提交的同一个官方 ZIP：`stan-chrome-1.9.6.zip`，版本为 `1.9.6`。手动加载不会通过 Chrome 网上应用店自动更新，浏览器也可能显示开发者模式提示。请从[官方 GitHub Release](https://github.com/stan-key/extension-source/releases/latest)获取当前包。

## 1. 下载官方 ZIP

打开[最新 Release](https://github.com/stan-key/extension-source/releases/latest)，下载：

- [`stan-chrome-1.9.6.zip`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip)
- [`stan-chrome-1.9.6.zip.sha256`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip.sha256)

这是唯一的 Chrome ZIP。它与 Chrome provider 验证并提交的字节完全相同；请不要寻找或创建“中国版”ZIP。

## 2. 可选：验证 SHA-256

这一步是可选的信号，不是安装前提。Windows PowerShell：

```powershell
Get-FileHash .\stan-chrome-1.9.6.zip -Algorithm SHA256
```

将输出的值与同一 Release 中的 `stan-chrome-1.9.6.zip.sha256` 比较。你也可以在 [`snapshot.json`](./snapshot.json) 中检查当前版本和 SHA-256。

## 3. 解压 ZIP

将 ZIP 解压到本地文件夹。下一步选择的文件夹必须是包含 `manifest.json` 的目录；不要选择 ZIP 文件本身，也不要选择包外层的其他目录。可以先打开[已发布 Chrome 源码](./extension/chrome/)检查文件布局。

## 4. 在 Google Chrome 中加载

1. 在地址栏打开 `chrome://extensions`。
2. 打开右上角的 **Developer mode / 开发者模式**。
3. 点击 **Load unpacked / 加载已解压的扩展程序**。
4. 选择刚才解压、且其中直接包含 `manifest.json` 的文件夹。
5. 确认 Stan 出现在扩展列表中；如 Chrome 显示开发者模式提示，这是手动加载的正常限制。

手动加载只会把本地文件夹加载到当前浏览器配置中。它不会自动跟随 GitHub Release 更新。

## 5. 验证 Stan 是否工作

安装后，打开受支持的 Steam 游戏页面或愿望单：

1. 确认页面地址来自 `store.steampowered.com`。
2. 等待页面完成加载。
3. 在 Steam 价格附近查看 Stan 的比较结果。
4. 只有身份、版本、市场、激活、库存和最终价格都能可靠比较时，Stan 才会显示 CTA；没有 CTA 不代表没有其他优惠。

## 6. 手动更新

1. 回到[最新 Release](https://github.com/stan-key/extension-source/releases/latest)。
2. 下载新的 `stan-chrome-1.9.6.zip` 和对应的 `.sha256` 文件。
3. 可选地重新验证 SHA-256。
4. 解压到一个新文件夹，确认 `manifest.json` 位于所选文件夹的根目录。
5. 在 `chrome://extensions` 中找到 Stan，点击 **Reload / 重新加载**，或移除旧的本地加载版本后重新 **Load unpacked**。
6. 删除旧文件夹前，确认新版本已经出现在扩展列表中。

手动安装没有 Chrome 网上应用店的自动更新；每次更新都应从 `releases/latest` 重新下载官方 ZIP。

## 7. 排查和支持

- 扩展未出现在列表中：确认选择的文件夹直接包含 `manifest.json`。
- 页面没有比较结果：确认打开的是受支持 Steam 页面；Stan 在证据不足时会保持安静。
- 浏览器显示警告：开发者模式和本地加载本身会带来浏览器提示。
- 需要安全帮助：请查看 [`SECURITY.md`](./SECURITY.md)。
- 其他问题：查看 [`SUPPORT.md`](./SUPPORT.md)，并说明浏览器名称、精确版本、Stan 版本和错误现象。

## 信任信息

- Stan 版本：`1.9.6`
- 官方 ZIP：[`stan-chrome-1.9.6.zip`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip)
- SHA-256：`cf206d0a85255b7a2f1c86f4be09d07aac894f5f75b72e0536a2cf2ac3bab9a7`（也可下载同一 Release 中的 `.sha256` 文件）
- SHA-256：[`stan-chrome-1.9.6.zip.sha256`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip.sha256)
- 快照：[`snapshot.json`](./snapshot.json)
- 源码：[`extension/chrome/`](./extension/chrome/)
- 权限说明：[`TRANSPARENCY.md`](./TRANSPARENCY.md)
- 支持：[`SUPPORT.md`](./SUPPORT.md)

当前 Chrome 发布版只请求 `storage`，host access 限制为 `https://api.stan-key.com/*`；不请求 `tabs`、浏览历史、cookies、`webRequest` 或 `<all_urls>`，也不执行远程代码。请以 Release 中实际发布的 manifest 和快照为准。
