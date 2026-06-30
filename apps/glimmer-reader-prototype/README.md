# Glimmer Reader Prototype

当前真正的微光伴读高保真 React 原型位于本目录。

这个原型是 `V0.1 作品集 Demo / 可交互原型` 的当前实现基准。页面 UI、高保真交互、AI 本地代理和作品集演示截图，都以这里为准。

## 本地运行

前置要求：Node.js。

```bash
npm install
npm run dev
```

本地预览地址固定为：

```text
http://127.0.0.1:3002/
```

开发服务器已固定 `127.0.0.1:3002` 且开启 `strictPort`，避免多个 Vite 服务同时运行导致页面命中错误服务。

## AI 配置

默认使用稳定 mock，适合面试演示和日常 UI 调整。

如需手动验收真实 DeepSeek 能力：

1. 复制 `.env.example` 为 `.env.local`。
2. 只在 `.env.local` 中填写真实 `DEEPSEEK_API_KEY`。
3. 按需把 `AI_SUMMARY_MODE` 或 `AI_ASSIST_MODE` 改为 `live`。

不要把真实 API Key 写入前端代码、README、Git 提交或对话消息。

当前真实能力范围：

- AI 今日总结：支持 mock / live 切换。
- 直接问：支持 mock / live 切换。
- 基于原文回答：保留接口、schema、mock 交互和未来扩展边界；详细规范确认后再接入真实生成。
