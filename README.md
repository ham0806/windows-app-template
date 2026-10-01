# Windowsアプリのひな形

Codexで小さなWindowsツールを作るための、Tauri 2ベースのひな形です。Reactで画面を作り、ブラウザやブックマークを必要としないWindowsアプリとして配布できます。

## 技術構成

- Tauri 2：デスクトップ機能、トレイ、ウィンドウの管理
- React 19 / TypeScript / Vite：画面の開発
- Tailwind CSS v4 / shadcn/uiの設計方針：見た目とUI部品
- Tauri Store：簡単な設定の保存
- SQLite：構造化されたローカルデータの保存
- 自動起動、通知、クリップボードへの書き込み、既定ブラウザでの外部リンク表示

製品版は同梱された静的ファイルを読み込みます。`localhost:1420`は開発時だけ使用します。GitHub ActionsのCIは使用せず、以下のコマンドでローカル検証します。

## Windowsで必要なもの

- Windows 11
- Node.js 22.12以上（Vite 7の要件を満たすバージョン）
- pnpm 10.11以上（このリポジトリでは10.11.0を指定）
- Rustの安定版とMSVCツールチェーン
- Visual Studio Build Toolsの「C++によるデスクトップ開発」とWindows SDK
- WebView2 Runtime（通常はWindows 11に導入済み）

## 新しいアプリを作る

GitHubの「Use this template」からリポジトリを作成し、そのフォルダーで実行します。

```powershell
pnpm install --frozen-lockfile
pnpm rename-app -- --name "マイツール" --identifier "dev.example.mytool"
pnpm desktop
```

`rename-app`はパッケージ名、製品名、ウィンドウタイトル、識別子、Rustクレート名、起動コード、HTMLタイトルを更新します。画面の見出しとトレイのツールチップは製品名を参照します。再実行できます。アプリ名はWindowsのファイル名に使用できる文字で指定してください。日本語名のみの場合、内部パッケージ名は`desktop-app`になります。

識別子を変更するとデータの保存先やWindows上のアプリの扱いが変わる場合があります。配布開始後は識別子を固定し、変更が必要な場合はデータ移行も設計してください。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | ブラウザで画面を確認。デスクトップ機能は無効 |
| `pnpm desktop` | Tauriの開発ウィンドウを起動 |
| `pnpm typecheck` | TypeScriptの型チェック |
| `pnpm test` | 名称変更とデスクトップ機能の回帰テスト |
| `pnpm build:web` | 同梱用の静的ファイルを生成 |
| `pnpm build` | Windows用MSI / NSISインストーラーを生成 |

インストーラーは`src-tauri/target/release/bundle/`に出力されます。`pnpm-lock.yaml`と`src-tauri/Cargo.lock`は再現可能なビルドのために管理します。依存関係の変更時はロックファイルも更新してください。`pnpm-workspace.yaml`ではesbuildのインストール処理だけを許可しています。

## 動作確認

画面にはSQLiteの初期化、設定保存、コピー、通知、自動起動の確認操作があります。操作中は連打を防ぎ、エラーを状態欄に表示します。設定保存はディスクへの書き込みを待ってから完了を表示します。自動起動の表示はOSから取得した状態を使い、初期状態の取得に失敗した場合は切り替えを無効にします。再確認するにはアプリを起動し直してください。

閉じるボタンはウィンドウを隠してトレイに格納します。トレイの「表示」で復帰し、「終了」でアプリを終了します。通知はWindowsの許可や集中モードにも依存するため、画面上の完了表示に加えて実際の通知も確認してください。

`settings.json`はTauri Store、`app.db`はSQLiteプラグインのアプリ用ディレクトリに保存します。ブラウザプレビューでは、データ保存・通知・自動起動を操作しません。

## 権限と安全性

`src-tauri/capabilities/default.json`で、メインウィンドウに必要な権限を定義しています。

- Tauriの基本機能
- Storeによる設定保存
- SQLiteの読み取りとSQL実行
- Openerによる外部URL表示
- 通知、クリップボードへのテキスト書き込み、自動起動の制御

外部リンク用の関数はHTTP / HTTPSのみを受け付けます。任意のシェル実行とクリップボード読み取りは有効にしていません。ffmpegやPythonなどが必要な場合はShellプラグインを追加し、必要なコマンドや同梱プログラムだけを許可してください。フロントエンドに秘密情報を置かないでください。

製品版にはCSPを設定しています。開発時にはViteのHMRとReactの開発用スクリプトに対応する専用CSPを設定しています。`devCsp: null`は製品版CSPを継承するため、開発用の許可を明示しています。

## フォルダー構成

```text
src/
  components/ui/       UI部品
  lib/desktop.ts       Tauriプラグインを呼び出す関数
  App.tsx              初期画面と機能の動作確認
src-tauri/
  capabilities/        デスクトップ権限
  src/lib.rs           プラグイン、トレイ、終了処理
  tauri.conf.json      ウィンドウ、CSP、配布設定
scripts/
  rename-app.mjs       アプリ名と識別子の変更
  rename-app.test.mjs  変更処理の回帰テスト
  desktop.test.mjs     プラグイン呼び出しの失敗経路テスト
AGENTS.md              Codex向けの開発方針
```

## Codexへの依頼例

```text
最初にAGENTS.mdを読んでください。
既存のTauriひな形を使ってWindowsデスクトップアプリとしてこの機能を実装してください。
製品版にlocalhostサーバーを導入しないでください。
Tauriの権限は必要なものだけを明示してください。
画面はReactと既存UI部品で作り、ネイティブ処理や権限が必要な処理はRust/Tauriに置いてください。
作業完了前にAGENTS.mdに記載されたチェックを実行してください。
```

リポジトリをテンプレートとして公開する場合は、GitHubの「Settings → General」で「Template repository」を有効にします。
