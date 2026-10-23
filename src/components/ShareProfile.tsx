import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Link } from "@tanstack/react-router";
import { Check, Copy, Download, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function profileUrl(id: string) {
  if (typeof window === "undefined") return `/m/${id}`;
  return `${window.location.origin}/m/${id}`;
}

export function ShareProfile({
  masterId,
  name,
  trigger,
}: {
  masterId: string;
  name: string;
  trigger?: React.ReactNode;
}) {
  const [url, setUrl] = useState(`/m/${masterId}`);
  const [copied, setCopied] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => setUrl(profileUrl(masterId)), [masterId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Ссылка скопирована");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Не удалось скопировать — выделите ссылку вручную");
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${name} — Мастер`, url });
      } catch {
        /* user closed the share sheet */
      }
    } else {
      copy();
    }
  };

  const download = () => {
    const canvas = wrap.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="rounded-full">
            <Share2 /> Поделиться
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Поделиться визиткой</DialogTitle>
          <DialogDescription>
            Покажите QR-код гостю у стойки или отправьте ссылку — профиль откроется в любом браузере.
          </DialogDescription>
        </DialogHeader>
        <div ref={wrap} className="mx-auto rounded-2xl bg-foreground p-3">
          <QRCodeCanvas
            value={url}
            size={200}
            marginSize={1}
            bgColor="#f7f3ea"
            fgColor="#1c1410"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url}</span>
          <button onClick={copy} aria-label="Скопировать ссылку" className="text-foreground">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={download}>
            <Download /> Скачать QR
          </Button>
          <Button onClick={nativeShare}>
            <Share2 /> Отправить
          </Button>
          <Button asChild variant="ghost" className="col-span-2">
            <Link to="/card" search={{ id: masterId }}>
              <Printer /> Бумажная визитка для печати
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
