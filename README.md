# dsh-approval-ding

DSH 停下来等你做决定时，响一声「叮」。不开页面、不切窗口也能听见。

只做这一件事：不注册按钮，不改审批结果，也不接管任何流程；请求继续按原来的方式走。

## 什么时候响

监听宿主的两个请求事件，下面这些情况都会响：

- 权限模式需要你确认某次工具调用（`approval/request`）；
- 开启自动审查（Auto review）后，审查拒绝某次调用、转成审批问你；
- DSH 弹出选择题、判断题等你回答（`user-questions/request`，即 `ask_user_question`）；
- 其他插件发起的审批或提问请求。

任务完成时不响。监听器挂在请求链最前面：先响一声，再把请求原样交给真正做决定的插件，所以不会改变任何审批结果或答案。

## 安装

```bash
pnpm dsh plugin --profile <profile> add 'github:zba0326/dsh-approval-ding'
```

或者打开 GUI 的 **插件 → 添加插件**，粘贴仓库地址，装完刷新窗口。

装好后在 **Plugins** 里启用 **Decision chime**。支持 HMR 的 profile 会直接生效，否则重启 DSH。

## 配置

默认 `Glass`、音量 `0.9`。想换声音，在 profile 的 `cordis.patch.yml` 里用同一个 id 覆盖（不要改插件自带的 patch）：

```yaml
- id: approval-ding
  name: dsh-approval-ding
  config:
    sound: Ping    # macOS 系统音名，或绝对路径，如 /System/Library/Sounds/Ping.aiff
    volume: 1      # 0–1
    enabled: true  # false 可临时静音
```

macOS 可选音名：`Basso` `Blow` `Bottle` `Frog` `Funk` `Glass` `Hero` `Morse` `Ping` `Pop` `Purr` `Sosumi` `Submarine` `Tink`。

Windows 用系统 Asterisk 提示音；Linux 依次尝试 `paplay` 的 freedesktop 完成音和 `canberra-gtk-play`。

两次响铃间隔小于 700ms 时只响一次，避免连续请求叠在一起。

## 为什么在宿主侧做

浏览器里的提示音会受标签页节流、后台静音和自动播放策略影响，页面关着就完全听不到；而审批和提问都是宿主的 waterfall 请求，在宿主侧监听可以保证「只要请求发生就一定响」，和页面开不开无关。

## 验证

1. 装好后在 **Plugins** 里能看到「交互提示音 / Decision chime」。
2. 让一个需要审批的工具调用发生，或者用 `ask_user_question` 问你一个问题——卡片出现的同时应听到一声。

## License

MIT
