export interface CommandResult {
  output: string[]
  status: 'success' | 'error' | 'info'
}

export const commandRegistry: Record<string, () => CommandResult> = {
  help: () => ({
    output: [
      '╔═══════════════════════════════════════════════╗',
      '║         JARVIS COMMAND REGISTRY              ║',
      '╠═══════════════════════════════════════════════╣',
      '║  System Commands:                            ║',
      '║    status      - Show system status          ║',
      '║    analyze     - Analyze current project     ║',
      '║    deploy      - Deploy application          ║',
      '║    clear       - Clear terminal              ║',
      '║                                               ║',
      '║  Project Commands:                           ║',
      '║    projects    - List all projects           ║',
      '║    create      - Create new project          ║',
      '║    open [name] - Open project                ║',
      '║                                               ║',
      '║  Code Commands:                              ║',
      '║    build       - Build project               ║',
      '║    test        - Run tests                   ║',
      '║    lint        - Run linter                  ║',
      '║                                               ║',
      '║  JARVIS Commands:                            ║',
      '║    jarvis --info    - System information     ║',
      '║    jarvis --update  - Check for updates      ║',
      '║    jarvis --config  - Open configuration     ║',
      '╚═══════════════════════════════════════════════╝',
    ],
    status: 'info',
  }),

  status: () => ({
    output: [
      '╔═══════════════════════════════════════════════╗',
      '║         SYSTEM STATUS REPORT                 ║',
      '╠═══════════════════════════════════════════════╣',
      `║  Time: ${new Date().toLocaleString()}           ║`,
      '║  Status: OPERATIONAL                         ║',
      '║                                               ║',
      '║  Components:                                 ║',
      '║    ✓ Neural Core       [ACTIVE]              ║',
      '║    ✓ Security Layer    [ENABLED]             ║',
      '║    ✓ Voice Recognition [READY]               ║',
      '║    ✓ Database          [CONNECTED]           ║',
      '║    ✓ Network           [ONLINE]              ║',
      '║                                               ║',
      '║  Resources:                                  ║',
      `║    CPU Usage:    ${Math.floor(Math.random() * 30 + 20)}%                      ║`,
      `║    Memory:       ${Math.floor(Math.random() * 40 + 30)}%                      ║`,
      `║    Disk:         ${Math.floor(Math.random() * 50 + 30)}%                      ║`,
      '║                                               ║',
      '║  All systems nominal.                        ║',
      '╚═══════════════════════════════════════════════╝',
    ],
    status: 'success',
  }),

  analyze: () => ({
    output: [
      'Initiating comprehensive system analysis...',
      '',
      '[████████████████████] 100%',
      '',
      'Analysis Results:',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '✓ Code Quality:        EXCELLENT',
      '✓ Security Scan:       NO VULNERABILITIES',
      '✓ Performance:         OPTIMIZED',
      '✓ Dependencies:        UP TO DATE',
      '✓ Test Coverage:       95%',
      '✓ Documentation:       COMPLETE',
      '',
      'Recommendations:',
      '  • No critical issues detected',
      '  • System is running at optimal performance',
      '',
      'Analysis complete. Sir, everything looks good.',
    ],
    status: 'success',
  }),

  deploy: () => ({
    output: [
      'Initiating deployment sequence...',
      '',
      '[1/7] Validating environment variables...',
      '[2/7] Running build process...',
      '[3/7] Executing test suite...',
      '[4/7] Creating Docker container...',
      '[5/7] Pushing to container registry...',
      '[6/7] Deploying to production server...',
      '[7/7] Running health checks...',
      '',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '✓ Deployment successful!',
      '',
      `Deployed at: ${new Date().toLocaleString()}`,
      'Environment: Production',
      'Status: All services running',
      '',
      'Sir, the application is now live.',
    ],
    status: 'success',
  }),

  projects: () => ({
    output: [
      'Active Projects:',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      '1. ⚡ Project Alpha',
      '   Type: Next.js Application',
      '   Status: Active',
      '   Progress: [████████░░] 75%',
      '   Last Update: 2 hours ago',
      '',
      '2. 🚀 Project Beta',
      '   Type: React Native App',
      '   Status: Development',
      '   Progress: [█████░░░░░] 45%',
      '   Last Update: 1 day ago',
      '',
      '3. 🔧 Project Gamma',
      '   Type: Python API',
      '   Status: Testing',
      '   Progress: [█████████░] 90%',
      '   Last Update: 5 hours ago',
      '',
      'Total Projects: 3',
      'Active: 2 | Completed: 0 | On Hold: 1',
    ],
    status: 'info',
  }),

  build: () => ({
    output: [
      'Starting build process...',
      '',
      '> jarvis-os@7.3.1 build',
      '> next build',
      '',
      'Compiling application...',
      '✓ Compiled successfully',
      '',
      'Creating optimized production build...',
      '✓ Collecting page data',
      '✓ Generating static pages (12/12)',
      '✓ Finalizing page optimization',
      '',
      'Build completed in 23.4s',
      '',
      'Sir, the build is ready for deployment.',
    ],
    status: 'success',
  }),

  test: () => ({
    output: [
      'Running test suite...',
      '',
      'PASS  components/core/JarvisCore.test.tsx',
      'PASS  components/hud/CommandCenter.test.tsx',
      'PASS  components/interface/Terminal.test.tsx',
      'PASS  lib/voice/speechRecognition.test.ts',
      '',
      'Test Suites: 4 passed, 4 total',
      'Tests:       24 passed, 24 total',
      'Snapshots:   0 total',
      'Time:        4.532 s',
      'Coverage:    95.2%',
      '',
      '✓ All tests passed successfully.',
    ],
    status: 'success',
  }),
}

export const executeCommand = (command: string): CommandResult => {
  const cmd = command.trim().toLowerCase()
  
  if (commandRegistry[cmd]) {
    return commandRegistry[cmd]()
  }

  if (cmd.startsWith('jarvis')) {
    return {
      output: [
        'Processing JARVIS command...',
        '',
        `Command: ${command}`,
        '',
        'Sir, I have executed your request.',
      ],
      status: 'success',
    }
  }

  return {
    output: [
      `Command not found: ${command}`,
      '',
      'Type "help" to see available commands.',
    ],
    status: 'error',
  }
}