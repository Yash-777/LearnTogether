main                -> always deployable
feature/add-login   -> branch off main, work, open a PR, merge back, delete

git checkout main
git pull
git checkout -b feature/add-login
# ...commits...
git push -u origin feature/add-login
# open a Pull Request, merge when approved
git branch -d feature/add-login
