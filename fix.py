with open('src/app/admin/finances/page.tsx', 'r') as f:
    lines = f.readlines()
with open('src/app/admin/finances/page.tsx', 'w') as f:
    # Find the last "return (" and count divs
    f.writelines(lines[:231])
    f.write("        </div>\n    </div>\n  )\n}\n")
