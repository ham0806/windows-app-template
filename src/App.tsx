import { useEffect, useState } from "react";
import { Bell, Clipboard, Database, ExternalLink, MonitorUp, Rocket, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { copyText, getLaunchAtStartup, initDatabase, isTauri, notify, openExternal, saveExampleSetting, setLaunchAtStartup } from "@/lib/desktop";

const features = [
  [Database, "SQLite", "ローカルDBを app.db に保存"],
  [Settings2, "Store", "設定を settings.json に保存"],
  [MonitorUp, "Autostart", "Windowsログイン時の自動起動"],
  [Bell, "Notification", "Windows通知"],
  [Clipboard, "Clipboard", "テキストのコピー"],
  [ExternalLink, "External URLs", "URLを既定ブラウザで開くのみ"],
] as const;

export default function App() {
  const [status, setStatus] = useState("Ready");
  const [autostart, setAutostart] = useState(false);
  const desktop = isTauri();

  useEffect(() => {
    if (desktop) getLaunchAtStartup().then(setAutostart).catch(() => undefined);
  }, [desktop]);

  async function run(label: string, action: () => Promise<void>) {
    try {
      setStatus(`${label}...`);
      await action();
      setStatus(`${label} OK`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
        <header className="mb-8 flex items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-5" /></div>
            <div>
              <h1 className="text-lg font-semibold">Windows App Template</h1>
              <p className="text-sm text-muted-foreground">Tauri 2 · React 19 · TypeScript · shadcn/ui · Tailwind v4</p>
            </div>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{desktop ? "Desktop" : "Browser preview"}</span>
        </header>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl"><Rocket className="size-5" /> Codex-ready desktop starter</CardTitle>
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
                <CardTitle>Smoke test</CardTitle>
                <CardDescription>Tauri機能の疎通確認用。ブラウザpreviewでは実行しません。</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button disabled={!desktop} onClick={() => run("SQLite", initDatabase)}>Initialize SQLite</Button>
                <Button disabled={!desktop} variant="outline" onClick={() => run("Store", () => saveExampleSetting(new Date().toISOString()))}>Save setting</Button>
                <Button disabled={!desktop} variant="outline" onClick={() => run("Clipboard", () => copyText("Tauri template is ready"))}>Copy test text</Button>
                <Button disabled={!desktop} variant="outline" onClick={() => run("Notification", () => notify("Windows App Template", "Notification works."))}>Send notification</Button>
                <Button variant="ghost" onClick={() => openExternal("https://v2.tauri.app/")}>Open Tauri docs <ExternalLink className="size-4" /></Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Windows startup</CardTitle>
                <CardDescription>必要なアプリだけユーザー操作で有効化。</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <span className="text-sm">Launch at sign-in</span>
                  <input
                    className="size-4 accent-current"
                    type="checkbox"
                    checked={autostart}
                    disabled={!desktop}
                    onChange={(event) => {
                      const value = event.target.checked;
                      setAutostart(value);
                      run("Autostart", () => setLaunchAtStartup(value));
                    }}
                  />
                </label>
              </CardContent>
            </Card>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">Status: {status}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
