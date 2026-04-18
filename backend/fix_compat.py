"""Fix Python 3.9 compat: patch corrupted files and add future annotations."""
import os

BASE = os.path.dirname(__file__)

# 1. Fix corrupted files that have literal \n instead of real newlines
corrupted_files = [
    'app/schemas/common.py',
    'app/schemas/user.py',
    'app/services/auth.py',
    'app/api/deps.py',
    'app/api/routes/setup.py',
    'app/db/session.py',
]

for fpath in corrupted_files:
    full = os.path.join(BASE, fpath)
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    # Replace literal \n\n with real newlines
    if '\\n\\n' in content:
        content = content.replace('\\n\\n', '\n')
        with open(full, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed corrupted: {fpath}')
    else:
        print(f'Not corrupted: {fpath}')

# 2. Add future annotations to files that need it
need_future = [
    'app/api/routes/student.py',
    'app/api/routes/teacher.py',
    'app/api/routes/coordinator.py',
    'app/api/routes/risk.py',
    'app/api/routes/alerts.py',
    'app/api/routes/interventions.py',
    'app/api/routes/lms.py',
]

for fpath in need_future:
    full = os.path.join(BASE, fpath)
    with open(full, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'from __future__' not in content:
        lines = content.split('\n')
        # Insert after docstring if present
        if lines[0].startswith('"""'):
            # Find closing """
            insert_idx = 1
            for i, line in enumerate(lines[1:], 1):
                if '"""' in line:
                    insert_idx = i + 1
                    break
            lines.insert(insert_idx, 'from __future__ import annotations')
            lines.insert(insert_idx + 1, '')
        else:
            lines.insert(0, 'from __future__ import annotations')
        content = '\n'.join(lines)
        with open(full, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Added future annotations: {fpath}')
    else:
        print(f'Already has annotations: {fpath}')

print('All done!')
