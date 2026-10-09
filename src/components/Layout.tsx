import type { ReactNode } from "react";
import { Banner, ThemeProvider } from "@ledgerhq/lumen-ui-react";

type LayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function Layout({ title, description, children }: LayoutProps) {
  return (
    <ThemeProvider colorScheme="system">
      <main className="bg-canvas min-h-screen px-24 py-32 body-2 text-base">
        <div className="mx-auto flex w-full max-w-960 flex-col gap-24">
          <header className="flex flex-col gap-8">
            <h1 className="heading-3 text-base">{title}</h1>
            {description ? <p className="body-2 text-muted">{description}</p> : null}
          </header>
          <Banner
            appearance="info"
            title="Runs entirely in your browser"
            description="The payload, signature and public key are never sent anywhere. Only the public Ledger provider list is fetched."
          />
          {children}
        </div>
      </main>
    </ThemeProvider>
  );
}
