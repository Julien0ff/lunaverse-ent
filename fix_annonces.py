with open('src/app/admin/annonces/page.tsx', 'r') as f:
    lines = f.readlines()
with open('src/app/admin/annonces/page.tsx', 'w') as f:
    f.writelines(lines[:311])
    f.write("    </div>\n  )\n}\n")
