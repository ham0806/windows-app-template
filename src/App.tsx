import appConfig from "../src-tauri/tauri.conf.json";
import { useEffect, useRef, useState } from "react";
import { Bell, Clipboard, Database, ExternalLink, MonitorUp, Rocket, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copyText, getLaunchAtStartup, initDatabase, isTauri, notify, openExternal, saveExampleSetting, setLaunchAtStartup } from "@/lib/desktop";

const features = [
  [Database, "SQLite", "ローカルDBを app.db に保存"],
  [Settings2, "Store", "設定を settings.json に保存"],
  [MonitorUp, "自動起動", "Windowsログイン時の自動起動"],
  [Bell, "通知", "Windows通知"],
  [Clipboard, "クリップボード", "テキストのコピー"],
  [ExternalLink, "外部リンク", "URLを既定ブラウザで開くのみ"],
] as const;

export default function App() {
  const [status, setStatus] = useState("準備完了");
  const [autostart, setAutostart] = useState(false);
  const desktop = isTauri();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [startupReady, setStartupReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (desktop) getLaunchAtStartup().then((value) => {
      if (active) { setAutostart(value); setStartupReady(true); }
    }).catch((error) => { if (active) setStatus(`自動起動の状態を取得できません: ${String(error)}`); });
    return () => { active = false; };
  }, [desktop]);

  async function run(label: string, action: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      setStatus(`${label}を実行中…`);
      await action();
      setStatus(`${label}が完了しました`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-5" /></div>
            <div>
              <h1 className="text-lg font-semibold">{appConfig.productName}</h1>
              <p className="text-sm text-muted-foreground">Tauri 2 · React 19 · TypeScript · shadcn/ui · Tailwind v4</p>
            </div>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{desktop ? "デスクトップ" : "ブラウザプレビュー"}</span>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl"><Rocket className="size-5" /> Codex向けWindowsアプリのひな形</CardTitle>
              <CardDescription>Web UIの作りやすさを残しつつ、完成品はlocalhost不要のWindowsアプリにします。</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {features.map(([Icon, title, desc]) => (
                  <div key={title} className="rounded-lg border border-border p-4">
                    <Icon className="mb-3 size-5 text-muted-foreground" />
                    <div className="font-medium">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>機能の動作確認</CardTitle>
                <CardDescription>Tauri機能の疎通確認用。ブラウザプレビューでは実行しません。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button disabled={!desktop || busy} onClick={() => run("SQLite", initDatabase)}>SQLiteを初期化</Button>
                <Button disabled={!desktop || busy} variant="outline" onClick={() => run("Store", () => saveExampleSetting(new Date().toISOString()))}>設定を保存</Button>
                <Button disabled={!desktop || busy} variant="outline" onClick={() => run("クリップボード", () => copyText("Tauriのひな形は準備完了です"))}>テスト用テキストをコピー</Button>
                <Button disabled={!desktop || busy} variant="outline" onClick={() => run("通知", () => notify(appConfig.productName, "通知の動作確認です。"))}>通知を送信</Button>
                <Button disabled={busy} variant="ghost" onClick={() => run("外部リンク", () => openExternal("https://v2.tauri.app/"))}>Tauriのドキュメントを開く <ExternalLink className="size-4" /></Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Windowsの自動起動</CardTitle>
                <CardDescription>必要なアプリだけユーザー操作で有効化。</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <span className="text-sm">ログイン時に起動</span>
                  <input
                    className="size-4 accent-current"
                    type="checkbox"
                    checked={autostart}
                    disabled={!desktop || busy || !startupReady}
                    onChange={(event) => {
                      const value = event.target.checked;
                      run("自動起動", async () => {
                        await setLaunchAtStartup(value);
                        setAutostart(await getLaunchAtStartup());
                      });
                    }}
                  />
                </label>
              </CardContent>
            </Card>

            <div role="status" aria-live="polite" className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">状態: {status}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
