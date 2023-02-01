[![CI - Increment Version on Merge](https://github.com/im-enrollment/upsert-tagged-releases-action/actions/workflows/increment-version-on-merge.yml/badge.svg)](https://github.com/im-enrollment/upsert-tagged-releases-action/actions/workflows/increment-version-on-merge.yml)

# Upsert Release Tags Action

Creates or updates release tags. The source tag and target tags cannot not be pre-releases.

Easily generates additonal major `v1` and `latest` tags.

## Index

- [Inputs](#inputs)
- [Outputs](#outputs)
- [Usage Examples](#usage-examples)
- [Caller](#caller)
- [Scope Group Types](#scope-group-types)
- [Contributing](#contributing)
  - [Recompiling](#recompiling)
  - [Incrementing the Version](#incrementing-the-version)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Inputs

| Parameter                  | Is Required | Default | Description                                                                                                                                                                 |
| -------------------------- | ----------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github-token`             | true        |         | Token required to get an authenticated Octokit.                                                                                                                             |
| `sha`                      | false       |         | SHA to reference by the 'target-tag' and 'additional-target-tags'. If not provided, gets the referenced SHA from the 'source-tag' or defaults to the current context's SHA. |
| `source-tag`               | false       |         | Tag to reference when generating the target tag(s). The 'sha' and 'source-tag' cannot be included together.                                                                 |
| `target-tag`               | false       |         | Tagged release to create based off of the 'source-tag' or 'sha'.                                                                                                            |
| `additional-target-tags`   | false       |         | List of tagged releases to create based off of the 'source-tag' or 'sha'.                                                                                                   |
| `include-major`            | false       | `false` | Create a tagged release of just the major from the 'source-tag'. v1.2.3 = v1                                                                                                |
| `include-major-minor`      | false       | `false` | Create a tagged release of just the major and minor from the 'source-tag'. v1.2.3 = v1.                                                                                     |
| `force-target`             | false       | `false` | Overwrite the 'target-tag' if it already exists                                                                                                                             |
| `force-additional-targets` | false       | `true`  | Overwrite the target tags in the 'additional-taget-tags' input if it already exists                                                                                         |
| `fail-on-invalid-version`  | false       | `true`  | Forces semver validation check on the 'source-tag' and 'target-tag'                                                                                                         |

> Additional inputs can be found on the [action definition](https://github.com/im-enrollment/upsert-tagged-releases-action/blob/main/action.yml)

## Usage Examples

### Standalone

```yml
jobs:
  jobname:
    runs-on: ubuntu-latest
    steps:
      - name: Compute destination parts
        uses: im-enrollment/upsert-tagged-releases@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          target-tag: v1.2.3
          additional-target-tags: | # by default ovewrites these tags if already exist
            latest
            mine
          include-major-tag: true
          force-target: true # overwrites v1.2.3 if it already exists


  # Creates tagged releases based on the current context's sha:
  # v1.2.3
  # v1
  # latest
  # mine
```

### With git-version-lite

```yml
jobs:
  jobname:
    runs-on: ubuntu-latest
    steps:
      - name: Increment the version
        uses: im-open/git-version-lite@v2.0.7
        id: version
        with:
          create-ref: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          default-release-type: major

      # Generates a next version of v1.2.3

      - name: Compute destination parts
        uses: im-enrollment/upsert-tagged-releases@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          sha: ${{ steps.version.outputs.NEXT_VERSION_SHA }}
          target-tag: ${{ steps.version.outputs.NEXT_VERSION }}
          additional-target-tags: latest
          include-major-tag: true

  # Creates tagged releases based off of the sha from git-version-lite:
  # v1.2.3
  # v1
  # latest
```

> See workflow automated test for more examples

## Contributing

When creating new PRs please ensure:

1. The action has been recompiled. See the [Recompiling](#recompiling) section below for more details.
2. For major or minor changes, at least one of the commit messages contains the appropriate `+semver:` keywords listed under [Incrementing the Version](#incrementing-the-version).
3. The `README.md` example has been updated with the new version. See [Incrementing the Version](#incrementing-the-version).
4. The action code does not contain sensitive information.

### Recompiling

If changes are made to the action's code in this repository, or its dependencies, you will need to re-compile the action.

```sh
# Installs dependencies and bundles the code
npm start

# Bundle the code (if dependencies are already installed)
npm run build
```

These commands utilize [esbuild](https://esbuild.github.io/getting-started/#bundling-for-node) to bundle the action and
its dependencies into a single file located in the `dist` folder.

### Incrementing the Version

This action uses [git-version-lite] to examine commit messages to determine whether to perform a major, minor or patch increment on merge. The following table provides the fragment that should be included in a commit message to active different increment strategies.
| Increment Type | Commit Message Fragment |
| -------------- | ------------------------------------------- |
| major | +semver:breaking |
| major | +semver:major |
| minor | +semver:feature |
| minor | +semver:minor |
| patch | _default increment type, no comment needed_ |

## Code of Conduct

This project has adopted the [im-open's Code of Conduct](https://github.com/im-open/.github/blob/main/CODE_OF_CONDUCT.md).

## License

Copyright &copy; 2022, Extend Health, LLC. Code released under the [MIT license](LICENSE).

[git-version-lite]: https://github.com/im-open/git-version-lite
