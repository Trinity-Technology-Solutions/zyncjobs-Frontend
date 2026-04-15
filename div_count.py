import re

f = open(r'C:/Users/lavan/Downloads/zyncjobs-Frontend/src/pages/CandidateDashboardPage.tsx', 'r')
lines = f.readlines()
f.close()

print(f'Total lines: {len(lines)}')

# Find Profile block end (the )} after activeTab Profile)
end = None
for i in range(1990, 2010):
    if lines[i].strip() == ')}':
        end = i
        print(f'Found )} at line {i+1}: {lines[i].rstrip()}')
        break

if end is None:
    print('Could not find end')
else:
    # Profile block: line 633 to end (0-indexed: 632 to end)
    depth = 0
    history = []
    for i in range(632, end+1):
        l = lines[i]
        opens = len(re.findall(r'<div[\s>]', l))
        closes = len(re.findall(r'</div>', l))
        if opens or closes:
            history.append((i+1, depth, opens, closes, depth+opens-closes, l.rstrip()))
        depth += opens - closes

    print(f'Final depth: {depth}')
    print("Last 10 div-related lines:")
    for entry in history[-10:]:
        lineno, before, o, c, after, text = entry
        marker = " <-- NEGATIVE" if after < 0 else ""
        print(f"  L{lineno} depth:{before}->{after}{marker}: {text[:70]}")
