<div align="center">

# Stan — Steam 比价 / Steam Key 比价浏览器扩展

### 在 Steam 页面和愿望单中直接比较价格。

**Stan 会将你正在查看的 Steam 价格，与经过验证且兼容的 Steam Key 优惠进行比较。**

[**Chrome 网上应用店安装**](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif) · [**Firefox Add-ons 安装**](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/)

[**简体中文安装指南**](./INSTALL.zh-CN.md)

官方商店是推荐的安装和更新渠道。指南也介绍如何检查当前 Chrome 官方包，以及商店无法访问时的手动安装备用方式。

如果你正在寻找 Steam 比价、Steam 价格比较或 Steam Key 比价，可以先从浏览器官方商店安装。

[官网](https://stan-key.com/?hl=zh_CN) · [查看扩展源码](./extension/) · [透明度说明](./TRANSPARENCY.md) · [快速审计](./AUDIT_GUIDE.md) · [最新 Release](https://github.com/stan-key/extension-source/releases/latest)

</div>

## 可审计的工程与发布

[`snapshot.json`](./snapshot.json) 为 Chrome、Firefox 和 Safari 分别记录版本、发布包与源码的 SHA-256、manifest 哈希及发布方交接记录。运行 [`./tools/audit-release all`](./AUDIT_GUIDE.md) 可检查 GitHub Release、校验文件、包内容、源码槽位、权限、网络与数据契约；报告明确区分 `PASS`、`FAIL` 和 `NOT_CHECKED`。

各浏览器的权限和数据字段都有机器可读契约。发布包不请求 `<all_urls>`、cookies、浏览历史、`tabs` 或 `webRequest`，也不加载远程可执行代码。查看[可审计工程栈](./AUDITABLE_STACK.md)、[审计步骤](./AUDIT_GUIDE.md)和[权限透明度说明](./TRANSPARENCY.md)。

## 下载和验证官方版本

GitHub Release 中的 `stan-chrome-1.9.6.zip` 是与 Chrome provider 验证并提交的完全相同的 ZIP，不存在单独的“中国版”安装包。

- 当前版本：`1.9.6`
- ZIP：[`stan-chrome-1.9.6.zip`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip)
- SHA-256：[`stan-chrome-1.9.6.zip.sha256`](https://github.com/stan-key/extension-source/releases/download/latest/stan-chrome-1.9.6.zip.sha256)
- [可选：按步骤手动安装](./INSTALL.zh-CN.md)

SHA-256 是可选的信号，不是非技术用户的安装前提。请只从[官方 Release](https://github.com/stan-key/extension-source/releases/latest)下载，不要使用未记录的镜像。

## 购买前先比较，无需离开 Steam

Steam 已经展示了游戏，**Stan 补上价格比较。** 当存在可以可靠比较的优惠时，它会显示在你正在查看的 Steam 价格旁边。无需另开比价网站，也无需创建账户。

Stan 会检查 Steam Key 激活、市场兼容性、库存以及可比最终价格。如果 edition、package、market 或 price 存在歧义，Stan 不会猜测，也不会显示购买 CTA。

## Chrome 网上应用店

如果你的网络可以访问 Chrome 网上应用店，那里仍是 Chrome 的标准安装和自动更新渠道：

[**在 Chrome 网上应用店安装 Stan**](https://chromewebstore.google.com/detail/ehhomikpbeokopccgmienllpnambnkif)

Chrome 网上应用店不可访问时，[GitHub Release](https://github.com/stan-key/extension-source/releases/latest) 和[手动安装指南](./INSTALL.zh-CN.md)是透明、可审计的备用路径。手动安装不会获得 Chrome 网上应用店的自动更新。

## Firefox Add-ons

Firefox 用户可通过 [Mozilla 官方 Firefox Add-ons 页面安装 Stan](https://addons.mozilla.org/firefox/addon/stan-steam-price-comparison/)。通过官方商店安装可接收 Firefox 的扩展更新。

## 隐私与透明度

Chrome 和 Firefox 发布包只声明 `storage` 权限，host permission 仅限 `https://api.stan-key.com/*`。Safari 的扩展包还声明 Steam host access，以支持其内容脚本。三者都不请求 `tabs`、浏览历史、cookies、`webRequest` 或 `<all_urls>`，也不加载远程可执行代码。完整权限按浏览器列在 [`security/permissions.json`](./security/permissions.json)。

浏览器端实际发布的代码可在 [`extension/`](./extension/) 中检查。版本：`1.9.6` · SHA-256：`cf206d0a85255b7a2f1c86f4be09d07aac894f5f75b72e0536a2cf2ac3bab9a7`。

联盟佣金不会改变排序；符合条件的优惠按可比最终价格排序。

[查看 `snapshot.json`](./snapshot.json) · [查看权限与隐私说明](./TRANSPARENCY.md)

> Stan 是独立产品。Steam 和 Valve 是 Valve Corporation 的商标。Stan 并非由 Valve 提供、认可或支持。
