import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
}

export function VideoDialog({ open, onOpenChange, videoUrl, title }: VideoDialogProps) {
  const isMobile = useIsMobile();
  const embedUrl = getEmbedUrl(videoUrl);

  const content = embedUrl ? (
    <div className="aspect-video rounded-md overflow-hidden border border-border">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  ) : (
    <a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-neon-blue hover:text-primary transition-colors py-4"
    >
      <ExternalLink className="w-4 h-4" /> Abrir vídeo
    </a>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-card border-border max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-primary">{title || '🎥 Vídeo'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">{title || '🎥 Vídeo'}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

interface DescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  html: string;
  title?: string;
}

export function DescriptionDialog({ open, onOpenChange, html, title }: DescriptionDialogProps) {
  const isMobile = useIsMobile();

  const content = (
    <div
      className="prose prose-invert prose-sm max-w-none overflow-y-auto max-h-[60vh]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-card border-border max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle className="font-display text-primary">{title || '📝 Descrição'}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">{title || '📝 Descrição'}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
