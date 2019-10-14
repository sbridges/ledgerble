#!/usr/bin/env node

const { spawn } = require('child_process');

const subprocess = spawn('npm', ['start', '--prefix',  __dirname], {
  detached: true,
  stdio: 'ignore'
});
subprocess.unref();
