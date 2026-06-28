"use client";

import { useEffect, useState } from "react";
import type QRCodeType from "qrcode";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMenuPublicUrl } from "@/lib/restaurant";

interface QrCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  restaurantName: string;
}

export function QrCodeModal({
  open,
  onOpenChange,
  slug,
  restaurantName,
}: QrCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const menuUrl = getMenuPublicUrl(slug, { src: "qr" });

  useEffect(() => {
    if (!open) return;

    import("qrcode").then((QRCode: typeof QRCodeType) =>
      QRCode.toDataURL(menuUrl, {
      width: 512,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      })
    ).then(setQrDataUrl);
  }, [open, menuUrl]);

  function handleDownload() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — {restaurantName}</DialogTitle>
          <DialogDescription>
            Scannez pour accéder au menu public
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code menu ${restaurantName}`}
              className="h-64 w-64 rounded-2xl border shadow-sm"
            />
          ) : (
            <div className="h-64 w-64 animate-pulse rounded-2xl bg-muted" />
          )}

          <p className="text-center text-sm text-muted-foreground break-all px-2">
            {menuUrl}
          </p>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button className="flex-1 gap-2" onClick={handleDownload} disabled={!qrDataUrl}>
              <Download className="h-4 w-4" />
              Télécharger PNG
            </Button>
            <Button variant="outline" className="flex-1 gap-2" asChild>
              <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Voir le menu
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
