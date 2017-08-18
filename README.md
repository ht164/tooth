# tooth
Mastodon Desktop Client

## 使い方
1. npm install
1. bower install
1. src/js/main.js 内の HOSTNAME をマストドンが動作しているサーバのホスト名に変えてください。
1. src/js/main.js 内の ACCESS_TOKEN を、ログインユーザに割り当てられるアクセストークンに変えてください。アクセストークンの取得方法やツールはGitHub等で公開されている方がいます。
1. npm run build-js
1. npm start

ホームタイムラインが表示されたら成功です。

## 動作環境

Node.jsが必要です。

## 未実装
* トゥート機能、返信機能
* トゥート削除を反映する機能
* Boost、Favする機能
* ログインユーザをGUIから設定できる機能
* などなど…

## LICENSE
MIT
