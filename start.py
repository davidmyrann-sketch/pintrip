#!/usr/bin/env python3
"""Startup wrapper — reads PORT from env and launches gunicorn."""
import os, subprocess, sys

port = os.environ.get('PORT', '5000')
print(f"[start] Launching gunicorn on 0.0.0.0:{port}", flush=True)

result = subprocess.run([
    sys.executable, '-m', 'gunicorn',
    'app:app',
    '--bind', f'0.0.0.0:{port}',
    '--workers', '1',
    '--timeout', '120',
    '--log-level', 'info',
    '--access-logfile', '-',
    '--error-logfile', '-',
])
sys.exit(result.returncode)
