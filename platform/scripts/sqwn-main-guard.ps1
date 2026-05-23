param([Parameter(Mandatory)][string]$SourceBranch,[switch]$Push,[switch]$DeleteSource)
$ErrorActionPreference='Stop'
if($SourceBranch -eq 'main'){throw 'SourceBranch invalido'}
function R([string]$c){iex $c;if($LASTEXITCODE){throw "Falhou: $c"}}
if(git status --porcelain){throw 'Worktree suja'}
R 'git fetch --all --prune'
R 'git checkout main'
R 'git pull --ff-only origin main'
R "git checkout $SourceBranch"
R "git pull --ff-only origin $SourceBranch"
R 'git rebase main'
R 'npm run web:type-check'
R 'npm run storybook:ci -- --smoke-test'
R 'npm run test'
R 'git checkout main'
R "git merge --no-ff $SourceBranch -m ""merge: $SourceBranch into main (sqwn)"""
R 'npm run web:type-check'
R 'npm run storybook:ci -- --smoke-test'
R 'npm run test'
if($Push){R 'git push origin main'}
if($DeleteSource){R "git branch -d $SourceBranch";R "git push origin --delete $SourceBranch"}
Write-Host 'OK'