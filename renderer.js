const skipchangelogLabel = ['skip-changelog'];
const fixLabel = ['fix', 'bug', 'hotfix']
const breakingLabel = ['breaking', 'breaking changes']
const featureLabel = ['feature', 'feat', 'enhancement']

const Renderer = {
    getPRformtNotes: (body) => {
        const reg = /in\shttps\:\/\/github\.com\/.+\/pull\/(\d+)\s/g;

        const arr = [...body.matchAll(reg)];

        return arr.map(n => n[1]); // pr number list
    },
    regToPrObj: (arr) => {
        return {
            cate: arr[1],
            component: arr[2],
            desc: arr[3],
        }
    },
    renderCate: (cate) => {
        return `${cate.sort().map(pr => {
            const title = pr.changelog ? `\`${pr.changelog.component}\`: ${pr.changelog.desc}` : pr.title
            return '- ' + title + ` [@${pr.user.login}](https://github.com/${pr.user.login}) ([#${pr.number}](${pr.html_url}))`
        }).join('\n')}`
    },
    renderMarkdown: (pullRequestList) => {
        // 分类靠标签
        // 标题看有没有更新日志
        const categories = {
            breaking: [],
            features: [],
            bugfix: [],
            extra: []
        }

        pullRequestList.forEach(pr => {
            pr.body = pr.body ? pr.body : '';

            // 不需要纳入 changelog 的 label
            if (pr.labels.find(l => skipchangelogLabel.indexOf(l.name) !== -1)) {
                console.log('pr ' + pr.number + ' 有skipchangelogLabel')
                return
            }
            // 在 pr body 明确填了 跳过 label
            if (pr.body.indexOf('[x] 本条 PR 不需要纳入 changelog') !== -1) {
                console.log('pr ', pr.number, ' 显示不需要纳入 changelog')
                return
            }

            if (pr.body.indexOf('### 📝 更新日志') !== -1) {

                const reg = /-\s([A-Za-z]+)\(([A-Za-z]+)\)\:\s(.+)/g

                const arr = [...pr.body.matchAll(reg)];

                if (arr.length === 0) {
                    console.log('没有找到任何一条日志内容', pr.number, pr.body);
                    categories.extra.push(pr);
                    return
                }

                arr.map(a => Renderer.regToPrObj(a)).forEach(changelog => {
                    const logItem = {
                        ...pr,
                        changelog
                    }

                    function isInLabel(label) {
                        return label.indexOf(changelog.cate) !== -1 || (arr.length === 1 && pr.labels.some(l => label.indexOf(l.name) !== -1))
                    }

                    if (isInLabel(breakingLabel)) {
                        categories.breaking.push(logItem)
                    } else if (isInLabel(featureLabel)) {
                        categories.features.push(logItem)
                    } else if (isInLabel(fixLabel)) {
                        categories.bugfix.push(logItem)
                    } else {
                        categories.extra.push(logItem)
                    }
                })
            } else {
                // 说明开发者没有按模版填写 pr，默认取 title
                console.log('pr ', pr.number, ' 没有填写模版')
                categories.extra.push(pr);  //??
            }
        });

        return [
            categories.breaking.length ?
                `### ❗ Breaking Changes
${Renderer.renderCate(categories.breaking)}` : '',

            categories.features.length ? `### 🚀 Features
${Renderer.renderCate(categories.features)}` : '',

            categories.bugfix.length ? `### 🐞 Bug Fixes
${Renderer.renderCate(categories.bugfix)}` : '',

            categories.extra.length ? `### 🚧 Others
${Renderer.renderCate(categories.extra)}` : ''].filter(n => n).join('\n')
    }
}

module.exports = Renderer;