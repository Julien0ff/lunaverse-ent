import re

with open('src/lib/discord-bot.ts', 'r') as f:
    content = f.read()

replacements = [
    (r'\b(m) =>', r'(\1: any) =>'),
    (r'\b(i) =>', r'(\1: any) =>'),
    (r'\b(item) =>', r'(\1: any) =>'),
    (r'\b(tx) =>', r'(\1: any) =>'),
    (r'\((u), (i)\) =>', r'(\1: any, \2: any) =>'),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open('src/lib/discord-bot.ts', 'w') as f:
    f.write(content)

