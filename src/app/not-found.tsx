import { ButtonLink } from "@/components/ui/button";
import { StateMessage } from "@/components/ui/state-message";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <StateMessage
        title="Página no encontrada"
        description="La página que buscas no existe."
        actions={<ButtonLink href="/home">Ir al inicio</ButtonLink>}
      />
    </main>
  );
}
