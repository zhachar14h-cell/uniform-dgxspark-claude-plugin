// The plugin's own tests, run by `claude plugin test <folder>` against the
// engine's test kit.
//
// Nothing beneath the plugins serves registration, the session's start or the
// pane, so each test stands the engine in for those with three small hooks and
// then reads back what the plugin did with them.
//
// Covered here: the tools the plugin puts in front of the model, the command
// it adds, and what the pane draws before any platform has answered. What the
// tools do against a real platform is exercised in a running session, not here.

import { expect, mock, test } from 'claude-code/testing'

/** The platform the tests pretend to talk to, so the pane has a URL to name. */
const URL = 'http://spark.local:18180'

/** Every tool this plugin declares, spelled as the model calls them. */
const TOOLS = [
  'mcp__uniform__uniform_list',
  'mcp__uniform__uniform_deploy',
  'mcp__uniform__uniform_status',
  'mcp__uniform__uniform_logs',
  'mcp__uniform__uniform_metrics',
  'mcp__uniform__uniform_stop',
]

test('registers the tools the model can call', async ($, on) => {
  const tools: string[] = []

  on('tool.register', (_$, e) => {
    tools.push(`mcp__uniform__${e.name}`)

    return { value: { tool: `mcp__uniform__${e.name}` } }
  })
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', () => ({ cwd: '/tmp' }))
  mock.clock(on)

  await $.session.start({ cwd: '/tmp', source: 'startup' })

  for (const tool of TOOLS) {
    expect(tools).toContain(tool)
  }
})

test('registers the /uniform command', async ($, on) => {
  const commands: string[] = []

  on('tool.register', (_$, e) => ({ value: { tool: `mcp__uniform__${e.name}` } }))
  on('command.register', (_$, e) => {
    commands.push(e.name)

    return { value: { command: e.name } }
  })
  on('session.start', () => ({ cwd: '/tmp' }))
  mock.clock(on)

  await $.session.start({ cwd: '/tmp', source: 'startup' })

  expect(commands).toContain('uniform')
})

test(
  'the pane names the configured platform',
  { options: { platform_url: URL } },
  async ($, on) => {
    on('tool.register', (_$, e) => ({ value: { tool: `mcp__uniform__${e.name}` } }))
    on('command.register', (_$, e) => ({ value: { command: e.name } }))
    on('session.start', () => ({ cwd: '/tmp' }))
    mock.clock(on)

    await $.session.start({ cwd: '/tmp', source: 'startup' })

    const ui = await $.ui.mount({
      plugin: 'uniform',
      surface: 'terminal',
      component: 'Pane',
      requestId: 'uniform-deployments',
      props: {},
    })

    expect(await ui.find({ type: 'Text', text: /spark\.local:18180/ })).toBeDefined()
  },
)

test('the pane falls back to the platform on this machine', async ($, on) => {
  on('tool.register', (_$, e) => ({ value: { tool: `mcp__uniform__${e.name}` } }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', () => ({ cwd: '/tmp' }))
  mock.clock(on)

  await $.session.start({ cwd: '/tmp', source: 'startup' })

  const ui = await $.ui.mount({
    plugin: 'uniform',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'uniform-deployments',
    props: {},
  })

  expect(await ui.find({ type: 'Text', text: /127\.0\.0\.1:18180/ })).toBeDefined()
})

test('the pane draws on every surface that has one', async ($, on) => {
  on('tool.register', (_$, e) => ({ value: { tool: `mcp__uniform__${e.name}` } }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('session.start', () => ({ cwd: '/tmp' }))
  mock.clock(on)

  await $.session.start({ cwd: '/tmp', source: 'startup' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'uniform',
      surface,
      component: 'Pane',
      requestId: 'uniform-deployments',
      props: {},
    })

    expect(await ui.find({ type: 'Text' })).toBeDefined()
  }
})
