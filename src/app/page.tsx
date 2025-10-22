import Scheduler from '@/components/scheduler';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function Home() {
  const logo = PlaceHolderImages.find((img) => img.id === 'logo');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="flex items-center gap-4 mb-6">
          {logo && (
            <Image
              src={logo.imageUrl}
              alt={logo.description}
              width={48}
              height={48}
              className="rounded-lg shadow-md"
              data-ai-hint={logo.imageHint}
            />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">
              Meeting Automator
            </h1>
            <p className="text-muted-foreground font-headline">Agenda tu próxima reunión</p>
          </div>
        </header>
        <p className="mb-8 max-w-3xl text-base md:text-lg text-foreground/80">
          Bienvenido. Agende su reunión de forma rápida y sencilla. Seleccione un día del calendario para ver los horarios disponibles, elija la hora que más le convenga y complete sus datos. ¡Así de fácil!
        </p>
        
        <Scheduler />
      </main>
      <footer className="text-center p-6 text-sm text-muted-foreground mt-8">
        <p>Diseñado para una programación eficiente.</p>
      </footer>
    </div>
  );
}
