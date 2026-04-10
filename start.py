#!/usr/bin/env python3
"""Startup wrapper — reads PORT from env and launches gunicorn."""
import os, subprocess, sys

print("=== ENV DEBUG ===", flush=True)
for k, v in sorted(os.environ.items()):
    print(f"  {k}={v!r}", flush=True)
print("=== END ENV ===", flush=True)

port = os.environ.get('PORT', '5000')
print(f"[start] PORT resolved to: {port!r}", flush=True)
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
