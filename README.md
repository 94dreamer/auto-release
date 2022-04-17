# auto release 
## 自动在 PR 内生成 更新日志

## example

```yml
name: Auto Release

on:
  pull_request:
    branches: [develop]
    types: [opened, synchronize, reopened, closed]
    paths:
      - "package.json"
  issue_comment:
    types: [edited]

jobs:
  generator:
    runs-on: ubuntu-latest
    if: >
      github.event_name == 'pull_request' &&
      github.event.pull_request.merged == false &&
      startsWith(github.head_ref, 'release/')
    steps:
      - run: echo "The head of this PR starts with 'release/'"
      - uses: actions/checkout@v3
      - uses: 94dreamer/auto-release@develop
        id: changelog
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Add comment
        uses: peter-evans/create-or-update-comment@v1
        with:
          issue-number: ${{ github.event.pull_request.number }}
          body: |
            ${{ steps.changelog.outputs.changelog }}
  comment_add_log:
    runs-on: ubuntu-latest
    if: >
      github.event_name == 'issue_comment'
      && github.event.issue.pull_request
      && github.event.sender.login == github.event.issue.user.login
      && startsWith(github.event.comment.body, '## ')
    steps:
      - id: comment
        shell: bash
        run: |
          result=$(curl ${{github.event.issue.pull_request.url}} -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}")
          headrefreg='"ref": "(release/[[:digit:]]{1,2}\.[[:digit:]]{1,2}\.[[:digit:]]{1,2})",'
          if [[ $result =~ $headrefreg ]]
          then
            echo "属于 release pr 的 comment ${BASH_REMATCH[1]}" 
          else
            echo "不属于 release pr 的 comment" && exit 1
          fi
          echo "::set-output name=branch::${BASH_REMATCH[1]}"
      - uses: actions/checkout@v3
        with:
          ref: ${{ steps.comment.outputs.branch }}
      - run: echo '${{ github.event.comment.body }}'
      - name: Commit and push if needed
        run: |
          echo "$(echo '${{ github.event.comment.body }}' | cat - CHANGELOG.md)" > CHANGELOG.md
          git add .
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git commit -m "chore: changelog's changes"
          git push
          echo "💾 pushed changelog's changes"
  merge_tag:
    runs-on: ubuntu-latest
    if: >
      github.event_name == 'pull_request' &&
      github.event.pull_request.merged == true &&
      startsWith(github.head_ref, 'release/')
    steps:
      - run: echo pr_merge_tag
```