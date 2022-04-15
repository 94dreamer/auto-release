# auto release 
## 自动在 PR 内生成 更新日志

## example

```yml
name: Auto Release

on:
  pull_request:
    branches: [develop]
    types: [opened, synchronize, reopened]
    paths:
      - "package.json"

jobs:
  generator:
    runs-on: ubuntu-latest
    if: startsWith(github.head_ref, 'release/')
    steps:
      - run: echo "The head of this PR starts with 'release/'"
      - uses: actions/checkout@v3
      - uses: 94dreamer/auto-release@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```