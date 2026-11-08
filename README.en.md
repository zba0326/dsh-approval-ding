# dsh-approval-ding

One short chime whenever DSH is waiting for you: a tool approval, or a question with choices. Close the window, switch apps — you still hear it.

That is all it does. It registers no buttons, changes no decision, and takes over nothing; the request continues down the original chain.

## When it chimes

It listens to two host request events:

- a tool call that needs your approval (`approval/request`);
- auto review rejecting a call and turning it into an approval question;
- a multiple-choice / judgement question from `ask_user_question` (`user-questions/request`);
- approvals or questions raised by other plugins.

It stays silent when a task merely completes. The listener is prepended to the request chain: it plays, then hands the request on unchanged, so no approval outcome or answer is affected.

## Install

```bash
pnpm dsh plugin --profile <profile> add 'github:zba0326/dsh-approval-ding'
```

Or **Plugins → Add plugin** in the GUI, paste the repository URL, then reload.

Enable **Decision chime** in Plugins. Profiles with HMR pick it up immediately; otherwise restart DSH.

## Configure

Defaults are `Funk` at volume `1`. Override with the same id in the profile's `cordis.patch.yml` (do not edit the plugin's own patch):

```yaml
- id: approval-ding
  name: dsh-approval-ding
  config:
    sound: Funk    # a macOS system sound name, or an absolute path
    volume: 1      # 0–1
    enabled: true  # false mutes it temporarily
```

macOS sound names: `Basso` `Blow` `Bottle` `Frog` `Funk` `Glass` `Hero` `Morse` `Ping` `Pop` `Purr` `Sosumi` `Submarine` `Tink`.

Windows uses the system Asterisk sound; Linux tries `paplay` with a freedesktop completion sound, then `canberra-gtk-play`.

Two requests closer than 700 ms produce one chime.

## Why host-side

Browser audio is subject to tab throttling, background muting and autoplay policy, and it is silent when the page is closed. Approvals and questions are host-side waterfall requests, so listening there guarantees a chime whenever the request happens, independent of any page.

## License

MIT
